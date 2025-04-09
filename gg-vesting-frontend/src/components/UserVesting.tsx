import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { encodePacked, formatEther, isAddress, padHex } from "viem";
import { useRouterUserAddress } from "~/hooks/useRouterUserAddress";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import Image from "next/image";
import { useToastTransaction } from "~/hooks/useToastTransaction";
import { COMMUNITY_POOL_ABI } from "../abi/communityPool.abi";
import { arbitrum, arbitrumNova } from "viem/chains";
import { GG_ABI, GG_ADDRESS } from "~/abi/GG.abi";
import { DropdownItems } from "./DropdownItems";

const LZ_CHAIN_IDS = {
  arbone: 110,
  nova: 175,
} as const;
const LZ_GAS = 2_000_000n;
const LZ_VERSION = 1;
const NETWORKS = ["arbone", "nova"] as const;
type Network = "arbone" | "nova";
const NETWORK_NAMES = {
  arbone: "Arbitrum One", 
  nova: "Arbitrum Nova"
} as const;
export const NETWORK_IMAGES: Record<Network, string> = {
  arbone: "/networks/arbone.png",
  nova: "/networks/arbnova.png"
}

interface ChartData {
  month: string;
  communityRewards: number;
  dustRewards: number;
  tokenRewards: number;
  totalRewards: number;
}
export const UserVesting = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const { listen } = useToastTransaction();
  const userRouterAddress = useRouterUserAddress();
  const [input, setInput] = useState("");
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [targetNetwork, setTargetNetwork] = useState<Network>("arbone");

  const { data: sendFeeData, isFetched: isSendFeeFetched } = useReadContract({
    abi: GG_ABI,
    address: GG_ADDRESS["nova"],
    functionName: "estimateSendFee",
    args: [LZ_CHAIN_IDS["arbone"], padHex(GG_ADDRESS["nova"], { size: 32 }), 100n, false, encodePacked(["uint16", "uint256"], [LZ_VERSION, LZ_GAS])]
  });
  
  const ggVesting = api.gg.dusts.useQuery({ owner: input }, { enabled: isAddress(input), refetchInterval: 0, refetchOnWindowFocus: false });

  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    console.log("in ggVesting");
    if (!ggVesting.data) return;
    setChartData(ggVesting.data.responses.map((response, i) => {
      const { totalCommunityRewardsClaimable, totalCommunityRewardsClaimed, totalTokenVesting, totalVestedClaimed, totalVestedUnclaimed, totalVested} = response.details;
      return {
        month: `Month ${i}`,
        communityRewards: Math.floor(Number(formatEther(BigInt(totalCommunityRewardsClaimable) + BigInt(totalCommunityRewardsClaimed)))),
        dustRewards: Math.floor(Number(formatEther(BigInt(totalVestedClaimed) + BigInt(totalVestedUnclaimed)))),
        tokenRewards: Math.floor(Number(formatEther(BigInt(totalTokenVesting)))),
        totalRewards: Math.floor(Number(formatEther(BigInt(totalVested))))
      }
    }));
  }, [ggVesting.data, ggVesting.isFetched])

  useEffect(() => {
    if (!router.isReady) return;
    const oldInput = input;
    setInput(userRouterAddress);
    if (oldInput !== userRouterAddress) {
      ggVesting.refetch();
    }
  }, [router.isReady, userRouterAddress]);

  const claimCommunityRewards = async () => {
    if (!ggVesting.data) return;
    if (!address) return;
    if (!isSendFeeFetched) return;
    setIsClaimLoading(true);
    try {
      const tx = await writeContractAsync({
        abi: COMMUNITY_POOL_ABI,
        address: "0x34D43300204d36f24f532EE157EC8b981683d25A",
        functionName: "batchClaim",
        args: [ggVesting.data.poolDustIds.map(id => BigInt(id)), address, LZ_CHAIN_IDS[targetNetwork]],
        value: targetNetwork === "arbone" ? sendFeeData![0] : 0n,
        chainId: arbitrumNova.id
      });
      await listen(tx, ggVesting.refetch);
    } finally {
      setIsClaimLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 justify-center items-center text-white pt-4 font-ubuntu w-[90%] md:w-[80%] lg:w-[70%]">
      {ggVesting.isFetching ? <LoadingSpinner /> : (
        <div className="flex flex-col gap-8 w-full items-center">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="white" />
              <YAxis width={100} tickFormatter={value => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} stroke="white"/>
              <Tooltip formatter={value => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}/>
              <Legend />
              <Area type="monotone" name="Total Rewards" dataKey="totalRewards" stackId="4" stroke="#ffc618" fill="#ffc618" fillOpacity={0.5}/>
              <Area type="monotone" name="Dust Rewards" dataKey="dustRewards" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.5}/>
              <Area type="monotone" name="Token Rewards" dataKey="tokenRewards" stackId="3" stroke="#afc658" fill="#afc658" fillOpacity={0.5}/>
              <Area type="monotone" name="Community Rewards" dataKey="communityRewards" stackId="1" stroke="#2884d8" fill="#2884d8" fillOpacity={0.5}/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex flex-row gap-4 items-center justify-center text-xl">
            <div className="flex flex-row gap-1 items-center justify-center">
              {(Number(formatEther(BigInt(ggVesting.data?.responses[0]?.details.totalCommunityRewardsClaimable ?? 0n)))).toFixed(2)} <Image className="" src="/gg.svg" alt="" width={20} height={20} />
            </div>
            <button 
              className="p-4 text-lg text-white bg-slate-900 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
              disabled={
                !isConnected || address?.toLowerCase() !== userRouterAddress.toLowerCase() ||
                isClaimLoading || BigInt(ggVesting.data?.responses[0]?.details.totalCommunityRewardsClaimable ?? 0n) === 0n ||
                chainId !== arbitrumNova.id
              }
              onClick={() => claimCommunityRewards()}
            >
              {isClaimLoading ? <LoadingSpinner /> : "Claim Community Rewards"}
            </button>
            to
            <DropdownItems selectedType={targetNetwork} setType={setTargetNetwork} choices={NETWORK_NAMES} typesOverride={NETWORKS} style="transparent" choiceImages={NETWORK_IMAGES} />
          </div>
        </div>
      )}
    </div>
  )
}