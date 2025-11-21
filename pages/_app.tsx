import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../components/auth/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>牛牛基地 - 信息交易平台</title>
        <meta name="description" content="牛牛基地是专业的信息交易平台，支持多种交易方式，安全可靠的联系方式获取" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}
