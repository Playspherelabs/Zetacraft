// chains.ts
export const zetaChainAthens = {
    id: 7001,
    name: 'ZetaChain Athens Testnet',
    network: 'zetachain-athens',
    nativeCurrency: {
      decimals: 18,
      name: 'Zeta',
      symbol: 'aZETA',
    },
    rpcUrls: {
      public: { http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'] },
      default: { http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'] },
    },
    blockExplorers: {
      default: { name: 'ZetaScan', url: 'https://athens3.explorer.zetachain.com' },
    },
    testnet: true,
  };
  
  export const sepolia = {
    id: 11155111,
    name: 'Sepolia',
    network: 'sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'SepoliaETH',
      symbol: 'ETH',
    },
    rpcUrls: {
      public: { http: ['https://rpc.sepolia.org'] },
      default: { http: ['https://rpc.sepolia.org'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    testnet: true,
  };
  
  export const bscTestnet = {
    id: 97,
    name: 'BSC Testnet',
    network: 'bsc-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'BSC Testnet',
      symbol: 'tBNB',
    },
    rpcUrls: {
      public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545/'] },
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545/'] },
    },
    blockExplorers: {
      default: { name: 'BscScan', url: 'https://testnet.bscscan.com' },
    },
    testnet: true,
  };
  