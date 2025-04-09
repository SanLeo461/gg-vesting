import { ponder } from "ponder:registry";
import { stakePackets } from "ponder:schema";
import { decodeAbiParameters, hexToBytes, parseAbiParameters } from "viem";

ponder.on("UltraLightNodeV2:Packet", async ({ event, context }) => {
  // const decoded = decodeAbiParameters(
  //   parseAbiParameters("uint64 nonce, uint16 localChainId, address ua, uint16 dstChainId"),
  //   event.args.payload.slice(0, 2 + ((64 + 16 + 160 + 16) / 4) + 2) as `0x${string}`
  // );
  const packet = event.args.payload.slice(2); // no 0x
  const nonce = BigInt(`0x${packet.slice(0, 16)}`);
  const dstChainId = BigInt(`0x${packet.slice(16 + 4 + 40, 16 + 4 + 40 + 4)}`);
  if (dstChainId !== 175n) {
    return;
  }
  const dstAddress = `0x${packet.slice(16 + 4 + 40 + 4, 16 + 4 + 40 + 4 + 40)}`.toLowerCase() as `0x${string}`;
  if (dstAddress !== "0xe1b3e83790377f0f3725edbf8fcee46016b3d0ec".toLowerCase()) {
    return;
  }

  const payload = `0x${packet.slice(16 + 4 + 40 + 4 + 40)}` as `0x${string}`;
  await context.db.insert(stakePackets).values({
    nonce,
    payload: payload
  }).onConflictDoNothing();
});