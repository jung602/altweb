// pages/index.tsx
'use client';

import dynamic from 'next/dynamic';
import localFont from "next/font/local";
import { useEffect, useState } from 'react';
import { Navigation } from '../components/Nav';

const HorizontalSceneScroll = dynamic(
  () => import('../components/HorizontalScene'),
  { ssr: false }
);

const VerticalSceneScroll = dynamic(
  () => import('../components/VerticalScene'),
  { ssr: false }
);

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
  const [isVerticalLayout, setIsVerticalLayout] = useState(true);

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
        bg-black
        overflow-hidden
        relative
      `}
    >
      <Navigation onLayoutChange={setIsVerticalLayout} />
      
      <div className="w-full h-screen absolute inset-0">
        {isVerticalLayout ? (
          <VerticalSceneScroll />
        ) : (
          <HorizontalSceneScroll />
        )}
      </div>
    </main>
  );
}