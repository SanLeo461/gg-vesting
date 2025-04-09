import { http } from 'wagmi'
import { arbitrumNova } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { fallback } from 'wagmi';
import { metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet, argentWallet, trustWallet, omniWallet, safeWallet, imTokenWallet, ledgerWallet, binanceWallet, bybitWallet, phantomWallet, uniswapWallet, rabbyWallet} from "@rainbow-me/rainbowkit/wallets"

export const config = getDefaultConfig({
  appName: 'GG Vesting Dashboard',
  projectId: '3ed7e3498ee4a76ea79b176de1514fcf',
  chains: [arbitrumNova],
  transports: {
    [arbitrumNova.id]: fallback([
      http()
    ]),
  },
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet, rabbyWallet, rainbowWallet, coinbaseWallet, walletConnectWallet
      ]
    },
    {
      groupName: "More",
      wallets: [
        safeWallet, argentWallet, trustWallet, omniWallet, imTokenWallet, ledgerWallet, binanceWallet, bybitWallet, phantomWallet, uniswapWallet
      ]
    }
  ]
});

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
