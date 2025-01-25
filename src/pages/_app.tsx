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
import Footer from '../components/Footer/Footer';
import Navbar from '../components/NavBar/NavBar';

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        <title>Nouns</title>
        <meta name="title" content="Nouns 95" />
        <meta name="description" content="One Noun. Every Day. Forever." />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdapp.com" />
        <meta property="og:title" content="Nouns 95" />
        <meta property="og:description" content="One Noun. Every Day. Forever." />
        <meta property="og:image" content="https://yourdapp.com/og-image.png" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://yourdapp.com" />
        <meta property="twitter:title" content="Nouns 95" />
        <meta property="twitter:description" content="One Noun. Every Day. Forever." />
        <meta property="twitter:image" content="https://yourdapp.com/og-image.png" />
      </Head>

      <WagmiConfig config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider modalSize="compact" showRecentTransactions={true}>
            <ApolloProvider client={apolloClient}>
              <div className="app-container">
                <Navbar backgroundColor="transparent" />
                <Component {...pageProps} />
                <Footer />
              </div>
            </ApolloProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </>
  );
}

export default MyApp;