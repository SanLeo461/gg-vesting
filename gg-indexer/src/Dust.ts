import { ponder, type Event, type Context } from "ponder:registry";
import { claimEvent, dustDetails, rageQuitEvent } from "ponder:schema";
import { zeroAddress } from "viem";

const cacheBlockCutoff = 82972847n;
const dustDetailsCache: Map<bigint, readonly [bigint, bigint, bigint, bigint]> = new Map();
let totalSupply = 0n;
let rewardIndex = 0n;

ponder.on("Dust:setup", async ({ context }) => {
  const currentIndex = BigInt((await context.client.getStorageAt({
    address: context.contracts.Dust.address,
    slot: "0x0",
    blockNumber: cacheBlockCutoff
  }))!);
  
  const batchSize = 10000n;
  for (let i = 1n; i < currentIndex; i += batchSize) {
    /// @ts-ignore
    const dustDetails = await context.client.multicall({
      contracts: Array.from({ length: Number(batchSize) }, (_, j) => ({
        abi: context.contracts.Dust.abi,
        address: context.contracts.Dust.address,
        functionName: "dustDetails",
        args: [i + BigInt(j)],
        blockNumber: cacheBlockCutoff
      })),
      blockNumber: cacheBlockCutoff,
      batchSize: Number(batchSize)
    });
    dustDetails.forEach((details, j) => {
      if (details.status !== "success") return;
      const result = details.result as [bigint, bigint, bigint, bigint];
      if (result[0] === 0n) return;
      dustDetailsCache.set(i + BigInt(j), result);
    });
  }
});

async function processRageQuit(event: Event<"Dust:RageQuit">, context: Context) {
  const { _dustId, _amountReleased, _amountToPool } = event.args;
  
  await context.db.insert(rageQuitEvent).values({
    id: _dustId,
    amountReleased: _amountReleased,
    amountToPool: _amountToPool
  });
  
  const dust = (await context.db.find(dustDetails, { tokenId: _dustId }))!;
  totalSupply -= dust.totalAllocation;

  if (totalSupply > 0n) {
    rewardIndex += _amountToPool * 10n**18n / totalSupply;
  }

  // contract shows released as totalAllocation -- we show it as the rage quitted amount
  await context.db.update(dustDetails, { tokenId: _dustId }).set((row) => ({
    released: _amountReleased
  }));
}

async function processClaim(event: Event<"Dust:Claimed">, context: Context) {
  const { _dustId, _amountReleased } = event.args;

  await context.db.insert(claimEvent).values({
    id: _dustId,
    amount: _amountReleased
  });

  await context.db.update(dustDetails, { tokenId: _dustId }).set((row) => ({
    vestingStartTime: event.block.timestamp,
    released: _amountReleased
  }));
}

ponder.on("Dust:RageQuit", async ({ event, context }) => {
  await processRageQuit(event, context);
});

ponder.on("DustRouter:RageQuit", async ({ event, context }) => {
  await processRageQuit(event, context);
});

ponder.on("Dust:Claimed", async ({ event, context }) => {
  await processClaim(event, context);
});

ponder.on("DustRouter:Claimed", async ({ event, context }) => {
  await processClaim(event, context);
});

ponder.on("Dust:Transfer", async ({ event, context }) => {
  const { tokenId, to, from } = event.args;
  if (from !== zeroAddress ) {
    return; // Only dealing with mints, not rage quits
  }
  const { client } = context;
  const { Dust } = context.contracts;

  let chainDustDetails = dustDetailsCache.get(tokenId);
  if (!chainDustDetails || event.block.number >= cacheBlockCutoff) {
    chainDustDetails = await client.readContract({
      abi: Dust.abi,
      address: Dust.address,
      functionName: "dustDetails",
      args: [tokenId]
    });
  }

  const [totalAllocation, released, startTime, planetId] = chainDustDetails;
  await context.db.insert(dustDetails).values({
    tokenId,
    totalAllocation,
    released,
    startTime,
    planetId,
    owner: to,
    checkpointCount: 0n,
    rewardIndex,
    vestingStartTime: 0n,
    communityRewardsClaimed: 0n
  });

  totalSupply += totalAllocation;
});

export function getRewardIndex() {
  return rewardIndex;
}