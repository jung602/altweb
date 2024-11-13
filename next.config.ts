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

    // draco 압축을 위한 worker 설정 (선택사항)
    config.resolve.alias = {
      ...config.resolve.alias,
      'three-stdlib': require.resolve('three-stdlib'),
    };

    return config;
  },
  // Three.js 관련 패키지들을 위한 transpile 설정
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};

export default nextConfig;