import { index, onchainTable } from "ponder";

export const rageQuitEvent = onchainTable(
  "rage_quit_event", 
  (t) => ({
    id: t.bigint().primaryKey(),
    amountReleased: t.bigint().notNull(),
    amountToPool: t.bigint().notNull()
  })
);

export const claimEvent = onchainTable(
  "claim_event",
  (t) => ({
    id: t.bigint().primaryKey(),
    amount: t.bigint().notNull()
  })
);

export const dustDetails = onchainTable(
  "dust_detail",
  (t) => ({
    tokenId: t.bigint().primaryKey(),
    totalAllocation: t.bigint().notNull(),
    released: t.bigint().notNull(),
    startTime: t.bigint().notNull(),
    planetId: t.bigint().notNull(),
    owner: t.hex().notNull(),
    checkpointCount: t.bigint().notNull(),
    rewardIndex: t.bigint().notNull(),
    vestingStartTime: t.bigint().notNull(),
    communityRewardsClaimed: t.bigint().notNull()
  }),
  (table) => ({
    tokenIndex: index().on(table.tokenId),
    ownerIndex: index().on(table.owner)
  })
);

export const dustCheckpoints = onchainTable(
  "dust_checkpoint",
  (t) => ({
    id: t.text().primaryKey(),
    tokenId: t.bigint().notNull(),
    owner: t.hex().notNull(),
    checkpointId: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
    vestingDuration: t.bigint().notNull(),
  }),
  (table) => ({
    tokenIndex: index().on(table.tokenId),
    ownerIndex: index().on(table.owner),
    checkpointIndex: index().on(table.checkpointId)
  })
);

export const stakePackets = onchainTable(
  "stake_packet",
  (t) => ({
    nonce: t.bigint().primaryKey(),
    payload: t.hex().notNull(),
  })
);

export const powPunksDetails = onchainTable(
  "pow_punks_detail",
  (t) => ({
    id: t.bigint().primaryKey(),
    owner: t.hex().notNull(),
    ggAmount: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    ownerIndex: index().on(table.owner)
  })
);

export const userConvertedDetails = onchainTable(
  "user_converted_detail",
  (t) => ({
    owner: t.hex().primaryKey(),
    amountConverted: t.bigint().notNull(),
  })
);