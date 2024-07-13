// pages/_app.tsx
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import 'reactflow/dist/style.css';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { GoogleAnalytics } from '@next/third-parties/google';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config } from '../config/config';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Component {...pageProps} />
          <GoogleAnalytics
            gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ''}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;