// pages/index.tsx
'use client';

import { SceneContainer } from '../components/SceneContainter';
import Titles from '../components/Titles';
import localFont from "next/font/local";
import { useEffect } from 'react';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  // 전체 페이지 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <main 
      className={`
        ${geistSans.variable} 
        ${geistMono.variable} 
        min-h-screen 
        w-full
        fixed 
        inset-0
        flex 
        flex-col 
        items-center 
        justify-center 
        bg-gradient-to-b 
        from-gray-50 
        to-gray-100
        overflow-hidden
        relative
      `}
    >
      {/* Scene Container (3D 모델들) */}
      <div className="w-full h-screen absolute inset-0">
        <SceneContainer />
      </div>
      
      {/* Titles (텍스트 오버레이) */}
      <div className="relative z-10">
        <Titles />
      </div>
    </main>
  );
}