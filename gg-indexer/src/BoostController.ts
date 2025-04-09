import { ponder } from "ponder:registry";
import { dustCheckpoints, dustDetails, stakePackets } from "ponder:schema";
import { decodeAbiParameters, parseAbiParameters } from "viem";

ponder.on("BoostController:Received", async ({ event, context }) => {
  const { nonce, user } = event.args;
  const packet = (await context.db.find(stakePackets, { nonce }))!;

  const decoded = decodeAbiParameters(
    parseAbiParameters("address sender, uint256[] dustIds, uint256[] vestingDurations"),
    packet.payload!
  );

  const dustIds = decoded[1];
  const vestingDurations = decoded[2];
  
  for (let i = 0; i < dustIds.length; i++) {
    const dust = (await context.db.find(dustDetails, { tokenId: dustIds[i]! }))!;
    const checkpointCounter = dust.checkpointCount!;

    await context.db.insert(dustCheckpoints).values({
      id: `${dustIds[i]}-${checkpointCounter}`,
      tokenId: dustIds[i]!,
      checkpointId: checkpointCounter,
      timestamp: event.block.timestamp,
      vestingDuration: vestingDurations[i]!,
      owner: dust.owner
    });

    await context.db.update(dustDetails, { tokenId: dustIds[i]! }).set((row) => ({
      checkpointCount: row.checkpointCount! + 1n
    }));
  }
});