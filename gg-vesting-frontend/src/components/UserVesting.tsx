import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { formatEther, isAddress } from "viem";
import { useRouterUserAddress } from "~/hooks/useRouterUserAddress";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ChartData {
  month: string;
  communityRewards: number;
  dustRewards: number;
  tokenRewards: number;
  totalRewards: number;
}
export const UserVesting = () => {
  const router = useRouter();
  const userRouterAddress = useRouterUserAddress();
  const [input, setInput] = useState("");
  
  const ggVesting = api.gg.dusts.useQuery({ owner: input }, { enabled: isAddress(input), refetchInterval: 0 });

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

  console.log(chartData);

  return (
    <div className="flex flex-col gap-4 justify-center items-center text-white pt-4 font-ubuntu w-[90%] md:w-[80%] lg:w-[70%]">
      {ggVesting.isLoading ? <LoadingSpinner /> : (
        <>
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
        </>
      )}
    </div>
  )
}