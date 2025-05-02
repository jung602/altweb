import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="description" content="3d room simulation" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* 성능 최적화를 위한 DNS 프리페치 및 프리커넥트 */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 중요 CSS 파일 미리 로드 */}
        <link rel="preload" href="/styles/globals.css" as="style" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="altroom" />
        <meta property="og:description" content="3d room simulation" />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="altroom" />
        <meta name="twitter:description" content="3d room simulation" />
        <meta name="twitter:image" content="/og-image.jpg" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
