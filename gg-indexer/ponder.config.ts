import { createConfig } from "ponder";
import { http } from "viem";

import { DUST_ABI } from "./abis/Dust.abi";
import { DOT_STAKING_ABI } from "./abis/DotStaking.abi";
import { COMMUNITY_POOL_ABI } from "./abis/CommunityPool.abi";
import { ULTRA_LIGHT_NODE_V2_ABI } from "./abis/UltraLightNodeV2.abi";
import { BOOST_CONTROLLER_ABI } from "./abis/BoostController.abi";
import { DUST_ROUTER_ABI } from "./abis/DustRouter.abi";
import { POW_PUNKS_VESTING_ABI } from "./abis/PowPunksVesting.abi";

export default createConfig({
  networks: {
    arbitrumNova: {
      chainId: 42170,
      transport: http(process.env.PONDER_RPC_URL_42170),
    },
    ethereum: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    }
  },
  contracts: {
    Dust: {
      abi: DUST_ABI,
      address: "0xbefe5fa80b6e2daaaefc82e930b18fb3245a634b",
      network: "arbitrumNova",
      startBlock: 36756302
    },
    DotStaking: {
      abi: DOT_STAKING_ABI,
      address: "0x2d6adce390953535e02d338dd2998c81170c06e3",
      network: "ethereum",
      startBlock: 20489083
    },
    CommunityPool: {
      abi: COMMUNITY_POOL_ABI,
      address: "0x34D43300204d36f24f532EE157EC8b981683d25A",
      network: "arbitrumNova",
      startBlock: 36756299
    },
    BoostController: {
      abi: BOOST_CONTROLLER_ABI,
      address: "0xe1B3e83790377F0F3725EDBf8Fcee46016b3D0eC",
      network: "arbitrumNova",
      startBlock: 75014602
    },
    UltraLightNodeV2: {
      abi: ULTRA_LIGHT_NODE_V2_ABI,
      address: "0x4d73adb72bc3dd368966edd0f0b2148401a178e2",
      network: "ethereum",
      startBlock: 20489083,
    },
    DustRouter: {
      abi: DUST_ROUTER_ABI,
      address: "0xa7a21c448d25d52041d2a96b8c20fc1102841a52",
      network: "arbitrumNova",
      startBlock: 74113778
    },
    PowPunksVesting: {
      abi: POW_PUNKS_VESTING_ABI,
      address: "0xce2d68c58f0a558b0f7878a42fd85a1e8b3fbd3e",
      network: "arbitrumNova",
      startBlock: 36833977
    }
  },
});
