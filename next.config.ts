import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',  // Static HTML 내보내기 설정
  images: {
    unoptimized: true, // GitHub Pages를 위한 이미지 설정
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/altweb' : '', // 레포지토리 이름으로 수정
  basePath: process.env.NODE_ENV === 'production' ? '/altweb' : '', // 레포지토리 이름으로 수정
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]'
      }
    });

    return config;
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei']
};

export default nextConfig;