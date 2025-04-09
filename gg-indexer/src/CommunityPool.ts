import { eq } from "ponder";
import { ponder } from "ponder:registry";
import { dustDetails } from "ponder:schema";
import { Address } from "viem";

ponder.on("CommunityPool:Claimed", async ({ event, context }) => {
  const { receiver, reward } = event.args;
  const ownedDustIds = (await context.db.sql
    .select({
      dustId: dustDetails.tokenId
    })
    .from(dustDetails)
    .where(eq(dustDetails.owner, receiver))).map((row) => row.dustId);
  
  const shareInfoResponses = await context.client.multicall({
    contracts: Array.from({ length: ownedDustIds.length }, (_, j) => ({
      abi: context.contracts.CommunityPool.abi,
      address: context.contracts.CommunityPool.address,
      functionName: "shareInfo",
      args: [ownedDustIds[j]]
    }))
  });
  await Promise.all(shareInfoResponses.map(async (response, j) => {
    if (response.status !== "success") throw new Error("Failed to get share info");
    // @ts-ignore
    const result = response.result as [Address, bigint, bigint, bigint, bigint];
    const [owner, balance, claimed, rewardIndex, vestingStartTime] = result;
    await context.db.update(dustDetails, { tokenId: ownedDustIds[j]! }).set((row) => ({
      communityRewardsClaimed: claimed
    }));
  }))
});