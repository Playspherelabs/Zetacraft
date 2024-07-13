

// config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { zetachainAthensTestnet, sepolia, bscTestnet } from 'wagmi/chains';
import { http } from 'viem';

// const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

// if (!projectId) {
//   throw new Error('You need to provide a NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID env variable');
// }

export const config = getDefaultConfig({
  appName: 'RainbowKit demo',
  projectId: 'dd13975ba8f862e48d36fccd385fb2ee',
  chains: [zetachainAthensTestnet, sepolia, bscTestnet],
  transports: {
    [zetachainAthensTestnet.id]: http(),
    [sepolia.id]: http(),
    [bscTestnet.id]: http(),
  },
});