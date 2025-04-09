import { randomUUID } from "crypto";
import { ponder } from "ponder:registry";
import { powPunksDetails, userConvertedDetails } from "ponder:schema";

ponder.on("PowPunksVesting:RegisteredStake", async ({ context, event }) => {
  await context.db.insert(powPunksDetails).values({
    id: BigInt(`0x${randomUUID().replace(/-/g, "")}`),
    owner: event.args.user,
    ggAmount: event.args.amount,
    timestamp: event.block.timestamp
  });
});

ponder.on("PowPunksVesting:Released", async ({ context, event }) => {

});

ponder.on("PowPunksVesting:Converted", async ({ context, event }) => {
  await context.db.insert(userConvertedDetails).values({
    owner: event.args.user,
    amountConverted: event.args.amount,
  }).onConflictDoUpdate((row) => ({
    amountConverted: row.amountConverted + event.args.amount
  }));
});