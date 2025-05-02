import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from "@vercel/analytics/react"
import { useEffect, useState, useCallback } from 'react';
import LoadingScreen from "@/components/ui/LoadingScreen";
import { Router } from 'next/router';
import Head from 'next/head';
import { forceGlobalMemoryCleanup } from '@/utils/memory/ResourceDisposal';
import { useSceneStore } from '@/store/sceneStore';

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const resetSceneState = useSceneStore((state) => state.resetState);

  // 상태 초기화 및 메모리 정리 함수를 useCallback으로 메모이제이션
  const cleanupResources = useCallback(() => {
    // 상태 초기화
    resetSceneState();
    // 메모리 정리
    forceGlobalMemoryCleanup();
    // 로컬 스토리지 정리
    try {
      localStorage.removeItem('scene-store');
    } catch (e) {
      // localStorage 접근 실패 시 무시
    }
  }, [resetSceneState]);

  // 라우터 이벤트 핸들러 메모이제이션
  const handleRouteChangeStart = useCallback(() => setIsLoading(true), []);
  const handleRouteChangeComplete = useCallback(() => setIsLoading(false), []);
  const handleRouteChangeError = useCallback(() => setIsLoading(false), []);

  useEffect(() => {
    // 앱 초기화 시 상태 초기화
    cleanupResources();

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 초기 로딩 처리 - 타이머 설정
    let timerId: number | ReturnType<typeof setTimeout>;
    
    // requestIdleCallback이 존재하는지 체크하고 사용
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      timerId = (window as any).requestIdleCallback(() => setIsLoading(false), { timeout: 2000 });
    } else {
      timerId = setTimeout(() => setIsLoading(false), 2000);
    }

    // 라우터 이벤트 처리
    Router.events.on('routeChangeStart', handleRouteChangeStart);
    Router.events.on('routeChangeComplete', handleRouteChangeComplete);
    Router.events.on('routeChangeError', handleRouteChangeError);

    // 메모리 정리 - 새로고침 또는 페이지 언로드 시
    window.addEventListener('beforeunload', cleanupResources);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      
      // 타이머 정리
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(timerId as number);
      } else {
        clearTimeout(timerId as ReturnType<typeof setTimeout>);
      }
      
      Router.events.off('routeChangeStart', handleRouteChangeStart);
      Router.events.off('routeChangeComplete', handleRouteChangeComplete);
      Router.events.off('routeChangeError', handleRouteChangeError);
      window.removeEventListener('beforeunload', cleanupResources);
      
      // 컴포넌트 언마운트 시 메모리 정리
      cleanupResources();
    };
  }, [cleanupResources, handleRouteChangeStart, handleRouteChangeComplete, handleRouteChangeError]);

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
