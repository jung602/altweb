// pages/index.tsx
import dynamic from 'next/dynamic';
import localFont from "next/font/local";

const Scene = dynamic(() => import('../components/Scene'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
});

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
  return (
    <main 
      className={`
        ${geistSans.variable} 
        ${geistMono.variable} 
        min-h-screen 
        w-full
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
      <div className="w-full h-screen absolute inset-0">
        <Scene />
      </div>
      
      <div className="relative z-10 text-center">
        Working in Progress
      </div>
    </main>
  );
}