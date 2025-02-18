import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect, useState } from 'react';
import LoadingScreen from "@/components/ui/LoadingScreen";
import { Router } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 초기 로딩 처리
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // 라우터 이벤트 처리
    Router.events.on('routeChangeStart', () => setIsLoading(true));
    Router.events.on('routeChangeComplete', () => setIsLoading(false));
    Router.events.on('routeChangeError', () => setIsLoading(false));

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      clearTimeout(timer);
      Router.events.off('routeChangeStart', () => setIsLoading(true));
      Router.events.off('routeChangeComplete', () => setIsLoading(false));
      Router.events.off('routeChangeError', () => setIsLoading(false));
    };
  }, []);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <Component {...pageProps} />
      <SpeedInsights />
    </>
  );
}
