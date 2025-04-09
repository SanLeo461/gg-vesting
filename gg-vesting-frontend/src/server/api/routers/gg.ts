import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const API_URL = process.env.API_URL!;

type VestingResponse = {
  timestamp: string;
  details: {
    totalCommunityRewards: string;
    totalCommunityRewardsClaimed: string;
    totalCommunityRewardsClaimable: string;
    totalDustValue: string;
    totalVestedClaimed: string;
    totalVestedUnclaimed: string;
    totalTokenVesting: string;
    totalTokenValue: string;
    totalVested: string;
  }
};
type UserVestedResponse = {
  responses: VestingResponse[];
  poolDustIds: string[];
}

export const ggRouter = createTRPCRouter({
  dusts: publicProcedure
    .input(z.object({ owner: z.string() }))
    .query(async ({ input }) => {
      const response = (await (await fetch(`${API_URL}/user/${input.owner}/vested`)).json()) as UserVestedResponse;

      return response;
    }),
  totalVested: publicProcedure
    .query(async () => {
      const response = (await (await fetch(`${API_URL}/totalVested`)).json()) as VestingResponse[];

      return response;
    }
  ),
});
