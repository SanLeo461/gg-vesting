import { db } from "ponder:api";
import schema, { dustCheckpoints, dustDetails } from "ponder:schema";
import { Context, Hono } from "hono";
import { client, graphql, asc, replaceBigInts } from "ponder";
import { getRewardIndex } from "../Dust";
import { Address, zeroAddress } from "viem";
import { BlankEnv, BlankInput } from "hono/types";
import fs from "fs";

const app = new Hono();

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;

const VESTING_DURATION = 63072000n;
const POW_PUNKS_VESTING_DURATION = 31536000n;
const COMMUNITY_POOL_VESTING_DURATION = 31536000n;

let timeStart = 0;
async function logTime(message: string) {
  const timeNow = Date.now();
  if (timeStart === 0) {
    timeStart = timeNow;
  }
  // fs.writeFileSync("time.txt", `${message}: ${timeNow - timeStart}ms\n`, { flag: "a" });
}

app.get("/dust/:dustId/vested", async (c) => {
  const dustId = BigInt(c.req.param("dustId"));
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const dust = await db.query.dustDetails.findFirst({
    where: (table, { eq }) => eq(table.tokenId, dustId)
  });
  const checkpoints = await db.query.dustCheckpoints.findMany({
    where: (table, { eq }) => eq(table.tokenId, dustId),
    orderBy: asc(dustCheckpoints.checkpointId)
  });
  if (!dust) throw new Error("Dust not found");

  const vested = amountVested(dustId, timestamp, checkpoints, dust);
  return c.json(replaceBigInts(vested, (v) => String(v)));
});

type VestingResponse = {
  timestamp: bigint;
  details: Omit<VestedDetails, "vested"> & PowPunksVestingDetails & { totalVested: bigint };
};
app.get("/user/:address/vested", async (c) => {
  logTime('start').catch(console.error);
  const dusts = await db.query.dustDetails.findMany({
    where: (table, { eq }) => eq(table.owner, c.req.param("address") as Address),
    limit: 100000
  });
  const address = c.req.param("address") as Address;

  const responses: VestingResponse[] = [];
  const poolDustIds: bigint[] = [];
  for (let i = 0; i < 24; i++) { // 1 month per i, 24 months
    const timestamp = BigInt(Math.floor(Date.now() / 1000)) + (2592000n * BigInt(i));
    const [vested, powPunksVesting] = await Promise.all([
      getVestedDetails(dusts, timestamp, address),
      getPowPunksVesting(address, timestamp)
    ]);
    let totalAssumedCommunityRewardsClaimable = 0n;
    vested.vested.forEach(dust => { // This is for counting community rewards for dust that have "finished" vesting, but haven't been claimed yet
                                 // This implies that the community rewards should start vesting *now*
      if (!dust.isVestingComplete) return; // Not vested yet :(
      if (dust.vestingStartTime !== 0n) return; // This has been accounted for by the community rewards claimable
                                          // Assuming when vesting finishes that we start at 0, not somewhere between 0 -> 1, approximation
      let vestedAmount = Math.min(i, 12); // Clamp to 12 months of vesting, since that's the max.
      totalAssumedCommunityRewardsClaimable += (dust.totalCommunityRewards * BigInt(vestedAmount)) / 12n;
    });

    responses.push({
      timestamp,
      details: {
        ...{...vested, totalCommunityRewardsClaimable: vested.totalCommunityRewardsClaimable + totalAssumedCommunityRewardsClaimable, vested: undefined},
        ...powPunksVesting,
        totalVested: vested.totalCommunityRewardsClaimable + vested.totalCommunityRewardsClaimed + vested.totalVestedClaimed + vested.totalVestedUnclaimed + powPunksVesting.totalTokenVesting,
      }
    });
    if (i == 0) {
      poolDustIds.push(...vested.vested.filter(v => v.isVestingComplete == true).map(v => v.tokenId));
    }
  }
  
  logTime('end').catch(console.error);

  return c.json(replaceBigInts({
    responses,
    poolDustIds
  }, (v => String(v))));
});

app.get("/totalVested/:timestamp", async (c) => {
  logTime('totalVestedStart').catch(console.error);
  const [dusts, powPunksDetails] = await Promise.all([
    db.query.dustDetails.findMany({
      limit: 1000000
    }),
    db.query.powPunksDetails.findMany({ limit: 1000000 })
  ]);
  const timestamp = BigInt(c.req.param("timestamp"));
  logTime('totalVestedRetrieve').catch(console.error);

  const [vested, powPunksVesting] = await Promise.all([
    getVestedDetails(dusts, timestamp),
    getPowPunksVesting(zeroAddress, timestamp, powPunksDetails)
  ]);
  logTime('totalVestedEnd').catch(console.error);

  return c.json({
    ...replaceBigInts({...vested, vested: undefined}, (v) => String(v)),
    ...replaceBigInts(powPunksVesting, (v) => String(v))
  });
});

type VestedDetails = {
  vested: ((typeof dustDetails.$inferSelect) & Awaited<ReturnType<typeof amountVested>>)[];
  totalCommunityRewards: bigint;
  totalCommunityRewardsClaimed: bigint;
  totalCommunityRewardsClaimable: bigint;
  totalDustValue: bigint;
  totalVestedClaimed: bigint;
  totalVestedUnclaimed: bigint;
};
async function getVestedDetails(dusts: (typeof dustDetails.$inferSelect)[], timestamp: bigint, owner?: Address): Promise<VestedDetails> {
  let totalCommunityRewards = 0n;
  let totalCommunityRewardsClaimed = 0n;
  let totalCommunityRewardsClaimable = 0n;
  let totalDustValue = 0n;
  let totalVestedClaimed = 0n;
  let totalVestedUnclaimed = 0n;
  let checkpointMap: Map<bigint, (typeof dustCheckpoints.$inferSelect)[]> = new Map();
  logTime('vestedStart').catch(console.error);
  if (owner) {
    const checkpoints = await db.query.dustCheckpoints.findMany({
      where: (table, { eq }) => eq(table.owner, owner),
      orderBy: asc(dustCheckpoints.checkpointId)
    });
    checkpoints.forEach(checkpoint => {
      if (!checkpointMap.has(checkpoint.tokenId)) {
        checkpointMap.set(checkpoint.tokenId, []);
      }
      checkpointMap.get(checkpoint.tokenId)!.push(checkpoint);
    });
  } else {
    const checkpoints = await db.query.dustCheckpoints.findMany({
      orderBy: asc(dustCheckpoints.checkpointId),
      limit: 1000000
    })
    checkpoints.forEach(checkpoint => {
      if (!checkpointMap.has(checkpoint.tokenId)) {
        checkpointMap.set(checkpoint.tokenId, []);
      }
      checkpointMap.get(checkpoint.tokenId)!.push(checkpoint);
    });
  }

  logTime('vestedCheckpoints').catch(console.error);
  const vested = dusts.map(dust => {
    const dustId = dust.tokenId;
    logTime("dust start " + dustId).catch(console.error);
    let checkpoints: (typeof dustCheckpoints.$inferSelect)[] = checkpointMap.get(dustId)!;
    // if (owner) checkpoints = checkpointMap.get(dustId);
    // if (checkpoints === undefined) {
    //   checkpoints = await db.query.dustCheckpoints.findMany({
    //     where: (table, { eq }) => eq(table.tokenId, dustId),
    //     orderBy: asc(dustCheckpoints.checkpointId)
    //   });
    // }
    logTime("dust checkpoint " + dustId).catch(console.error);

    const vested = amountVested(dustId, timestamp, checkpoints, dust);
    totalCommunityRewards += BigInt(vested.totalCommunityRewards);
    totalCommunityRewardsClaimed += BigInt(vested.communityRewardsClaimed);
    totalCommunityRewardsClaimable += BigInt(vested.communityRewardsClaimable);
    totalDustValue += dust.totalAllocation;
    totalVestedClaimed += dust.released;
    if (vested.isVestingComplete && dust.released === 0n) {
      totalVestedUnclaimed += BigInt(dust.totalAllocation);
    }
    logTime("dust end " + dustId).catch(console.error);
    
    return {
      dustId,
      ...vested,
      ...dust
    }
  });
  logTime('vestedEnd').catch(console.error);
  return {
    vested,
    totalCommunityRewards,
    totalCommunityRewardsClaimed,
    totalCommunityRewardsClaimable,
    totalDustValue,
    totalVestedClaimed,
    totalVestedUnclaimed
  }
}

function amountVested(dustId: bigint, timestamp: bigint, checkpoints: (typeof dustCheckpoints.$inferSelect)[], dust: typeof schema.dustDetails.$inferSelect) {
  const { tokenId, checkpointCount, owner, planetId, released, rewardIndex: dustRewardIndex, startTime, totalAllocation, vestingStartTime } = dust;

  let vested = 0n;
  // let communityVestStart = vestingStartTime === 0n ? max(startTime + VESTING_DURATION, timestamp) : vestingStartTime;
  const initialVest = totalAllocation / 4n;
  const remainingVest = totalAllocation - initialVest;

  if (timestamp > startTime + VESTING_DURATION) {
    vested = totalAllocation;
  } else if (checkpointCount == 0n) {
    vested = initialVest + ((
      remainingVest * (timestamp - startTime)
    ) / VESTING_DURATION);
  } else {
    let cumulatedAmount = initialVest;
    
    let lastCheckpointTimestamp = startTime;
    let lastCheckpointDuration = VESTING_DURATION;

    for (let i = 0; i < checkpointCount; i++) {
      const checkpoint = checkpoints[i]!;
      cumulatedAmount += (remainingVest *
        (checkpoint.timestamp - lastCheckpointTimestamp)
      ) / lastCheckpointDuration;

      lastCheckpointTimestamp = checkpoint.timestamp;
      lastCheckpointDuration = checkpoint.vestingDuration;
    }

    cumulatedAmount += (remainingVest *
      (timestamp - lastCheckpointTimestamp)
    ) / lastCheckpointDuration;

    if (cumulatedAmount > totalAllocation) cumulatedAmount = totalAllocation;

    vested = cumulatedAmount;
  }

  if (vested > totalAllocation) throw new Error("Vested amount exceeds total allocation");

  const totalCommunityRewards = (totalAllocation * (getRewardIndex() - dustRewardIndex)) / (10n**18n);
  let communityRewardsClaimable = 0n;
  
  if (vestingStartTime === 0n) {
    communityRewardsClaimable = 0n;
  } else if (timestamp > vestingStartTime + COMMUNITY_POOL_VESTING_DURATION) {
    communityRewardsClaimable = totalCommunityRewards;
  } else {
    communityRewardsClaimable = (totalCommunityRewards * (timestamp - vestingStartTime)) / COMMUNITY_POOL_VESTING_DURATION;
  }

  return {
    vested: vested,
    totalCommunityRewards: totalCommunityRewards,
    communityRewardsClaimed: dust.communityRewardsClaimed, // communityRewardsClaimed strictly less than communityRewardsClaimableVesting
    communityRewardsClaimable: (communityRewardsClaimable - dust.communityRewardsClaimed),
    communityRewardsClaimableVesting: communityRewardsClaimable, 
    isVestingComplete: vested == totalAllocation,
    checkpointCount: checkpointCount,
    rewardIndex: dustRewardIndex
  };
}

interface PowPunksVestingDetails {
  totalTokenVesting: bigint;
  totalTokenValue: bigint;
}
async function getPowPunksVesting(user: Address, timestamp: bigint, powPunksDetails?: (typeof schema.powPunksDetails.$inferSelect)[]): Promise<PowPunksVestingDetails> {
  logTime('powPunksStart').catch(console.error);
  if (!powPunksDetails) {
    powPunksDetails = await db.query.powPunksDetails.findMany({
      where: (table, { eq }) => eq(table.owner, user),
      limit: 100000
    });
  }

  let totalTokenVesting = 0n;
  let totalTokenValue = 0n;

  powPunksDetails.forEach((detail) => {
    totalTokenValue += detail.ggAmount;
    let vested = 0n;
    if (timestamp > detail.timestamp + POW_PUNKS_VESTING_DURATION) {
      vested = detail.ggAmount;
    } else {
      vested = (detail.ggAmount * (timestamp - detail.timestamp)) / POW_PUNKS_VESTING_DURATION;
    }
    totalTokenVesting += vested;
  });

  logTime('powPunksEnd').catch(console.error);

  return {
    totalTokenVesting,
    totalTokenValue
  }
}