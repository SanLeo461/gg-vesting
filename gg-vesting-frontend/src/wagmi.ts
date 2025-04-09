import { http } from 'wagmi'
import { arbitrumNova, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { fallback } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'GG Vesting Dashboard',
  projectId: '3ed7e3498ee4a76ea79b176de1514fcf',
  chains: [arbitrumNova],
  transports: {
    [arbitrumNova.id]: fallback([
      http()
    ]),
  },
});


declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
