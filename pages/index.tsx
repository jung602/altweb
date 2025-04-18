'use client';

import dynamic from 'next/dynamic';
import localFont from "next/font/local";
import Image from 'next/image';
import { useEffect } from 'react';
import { Navigation } from '../components/layout/Nav';

const UnifiedScene = dynamic(
  () => import('../components/scene/UnifiedScene'),
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
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
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
      <div className='fixed top-3 left-3 mix-blend-difference text-slate-50 text-sm font-geist-sans z-[10000]'>
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logowhite.png`}
          alt="Logo"
          width={54}
          height={54}
          priority
          className="w-auto h-[48px]"
        />
      </div>

      <Navigation />
      
      <div className="w-full h-screen absolute inset-0 bg-black">
        <UnifiedScene />
      </div>
    </main>
  );
}