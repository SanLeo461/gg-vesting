// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {CommunityPool} from "../src/CommunityPool.sol";
import {DustRouter} from "../src/DustRouter.sol";
import {PowPunksVesting} from "../src/PowPunksVesting.sol";
import {Dust} from "../src/Dust.sol";
import {DustIds} from "./DustIds.sol";
import {GG} from "../src/GG.sol";

contract VestScript is DustIds, Script {
    CommunityPool immutable communityPool = CommunityPool(0x34D43300204d36f24f532EE157EC8b981683d25A);
    DustRouter immutable dustRouter = DustRouter(0xa7A21C448d25D52041D2A96B8C20FC1102841A52);
    PowPunksVesting immutable powPunksVesting = PowPunksVesting(0xce2D68C58f0A558B0f7878A42FD85a1E8B3fBD3e);
    Dust immutable dust = Dust(0xbEfe5fA80b6E2daaAEfc82E930B18fB3245A634B);
    GG immutable gg = GG(0x000000000026839b3f4181f2cF69336af6153b99);

    function setUp() public {}

    function run() public {
        vm.startPrank(0xa624f88761E46eFd0e11d5240A5fE046D9A5a5eb);
        vm.warp(1804660189);

        // powPunksVesting.release(175);

        for (uint i = 0; i < 4571; i++) {
            uint32 id = DUST_IDS[i];
            // Want to call claim, but allow for reverts
            // dustRouter.claim(id, 175);
            address(dustRouter).call(abi.encodeWithSignature("claim(uint256,uint16)", uint256(id), 175));
        }
        console.logUint(gg.balanceOf(0x2C0BDb957F5a6976E4Ceb5A34470bFB13D30a278));
        vm.stopPrank();
    }
}
