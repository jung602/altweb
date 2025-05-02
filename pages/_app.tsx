import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/react"
import { useEffect, useState } from 'react';
import LoadingScreen from "@/components/ui/LoadingScreen";
import { Router } from 'next/router';
import Head from 'next/head';
import { forceGlobalMemoryCleanup } from '@/utils/memory/ResourceDisposal';
import { useSceneStore } from '@/store/sceneStore';

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const resetSceneState = useSceneStore((state) => state.resetState);

  useEffect(() => {
    // 앱 초기화 시 상태 초기화
    resetSceneState();
    
    // 로컬 스토리지 정리 (이전 persistent state가 남아있을 수 있음)
    try {
      localStorage.removeItem('scene-store');
    } catch (e) {
      // localStorage 접근 실패 시 무시
    }

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

    // 메모리 정리 - 새로고침 또는 페이지 언로드 시
    const handleBeforeUnload = () => {
      // 상태 초기화
      resetSceneState();
      // 메모리 정리
      forceGlobalMemoryCleanup();
      // 로컬 스토리지 정리 (이전 persistent state가 남아있을 수 있음)
      try {
        localStorage.removeItem('scene-store');
      } catch (e) {
        // localStorage 접근 실패 시 무시
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      clearTimeout(timer);
      Router.events.off('routeChangeStart', () => setIsLoading(true));
      Router.events.off('routeChangeComplete', () => setIsLoading(false));
      Router.events.off('routeChangeError', () => setIsLoading(false));
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // 컴포넌트 언마운트 시 메모리 정리
      resetSceneState();
      forceGlobalMemoryCleanup();
    };
  }, [resetSceneState]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>altroom</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <LoadingScreen isLoading={isLoading} />
      {isClient ? <Component {...pageProps} /> : null}
      <SpeedInsights />
      <Analytics />
    </>
  );
}
