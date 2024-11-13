import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // GLB/GLTF 파일 처리를 위한 규칙 추가
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]'
      }
    });

    return config;
  },
  // Three.js 관련 패키지들을 위한 transpile 설정
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  // src 디렉토리 사용 설정
  distDir: '.next',
};

export default nextConfig;