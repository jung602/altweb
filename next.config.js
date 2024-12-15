/** @type {import('next').NextConfig} */

const isGithubActions = process.env.GITHUB_ACTIONS || false
const repo = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, '') || ''

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  experimental: {
    appDir: false
  },
  assetPrefix: isGithubActions ? `/${repo}/` : '',
  basePath: isGithubActions ? `/${repo}` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH
  },
  
  // GLB 파일 처리를 위한 webpack 설정
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[path][name].[hash][ext]',
        publicPath: isGithubActions ? `/${repo}/_next/` : '/_next/',
      }
    });

    return config;
  }
};

module.exports = nextConfig;