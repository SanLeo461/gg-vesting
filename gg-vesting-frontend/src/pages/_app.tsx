import { type AppType } from "next/app";
import { Geist } from "next/font/google";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { api } from "~/utils/api";

import "~/styles/globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from "wagmi";
import { config } from "~/wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { arbitrumNova } from "viem/chains";
import { Toaster } from "react-hot-toast";

const geist = Geist({
  subsets: ["latin"],
});

const queryClient = new QueryClient()

const GGVestingApp: AppType = ({ Component, pageProps }) => {
  return (
    <div className={geist.className}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider initialChain={arbitrumNova}>
            <Component {...pageProps} />
            <Toaster />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
};

export default api.withTRPC(GGVestingApp);
