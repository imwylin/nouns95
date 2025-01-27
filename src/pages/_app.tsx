import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';
import { ApolloProvider } from '@apollo/client';
import apolloClient from '../apollo-client';
import Windows95 from '../components/Windows95/Windows95';
import { Analytics } from '@vercel/analytics/react';

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" type="image/png" href="/nouns95.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        <title>Nouns 95</title>
        <meta name="title" content="Nouns 95" />
        <meta name="description" content="One Noun. Every Day. Forever." />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nouns95.wtf" />
        <meta property="og:title" content="Nouns 95" />
        <meta property="og:description" content="One Noun. Every Day. Forever." />
        <meta property="og:image" content="https://nouns95.wtf/og-image.png" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://nouns95.wtf" />
        <meta property="twitter:title" content="Nouns 95" />
        <meta property="twitter:description" content="One Noun. Every Day. Forever." />
        <meta property="twitter:image" content="https://nouns95.wtf/og-image.png" />
      </Head>

      <WagmiConfig config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider modalSize="compact" showRecentTransactions={true}>
            <ApolloProvider client={apolloClient}>
              <Component {...pageProps} />
            </ApolloProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
      <Analytics />
    </>
  );
}

export default MyApp;