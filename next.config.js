/** @type {import('next').NextConfig} */

const isGithubActions = process.env.GITHUB_ACTIONS || false
const repo = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, '') || ''

const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  experimental: {
    // Fast Refresh 완전 비활성화
    fastRefresh: false,
  },
  assetPrefix: isGithubActions ? `/${repo}/` : '',
  basePath: isGithubActions ? `/${repo}` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubActions ? `/${repo}` : ''
  },
  
  // GLB 파일 처리를 위한 webpack 설정
  webpack: (config, { dev }) => {
    // 개발 모드에서 HMR 완전 비활성화
    if (dev) {
      config.watchOptions = {
        poll: false,
        ignored: /node_modules/
      };
      config.cache = false;
    }
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/main/models/[name][ext]',
        publicPath: isGithubActions ? `/${repo}/` : '/',
      }
    });

    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // module.context가 없을 경우 기본값 반환
            if (!module.context) {
              return 'vendor';
            }
            
            const packageNameMatch = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            if (!packageNameMatch || !packageNameMatch[1]) {
              return 'vendor';
            }
            
            const packageName = packageNameMatch[1];
            if (['three', 'react-three-fiber', '@react-three'].some(pkg => packageName.includes(pkg))) {
              return `vendor.${packageName.replace('@', '')}`;
            }
            return 'vendor';
          },
          priority: 10,
        },
      }
    };

    return config;
  },

  // Note: headers don't work with output: 'export', but we'll keep them for development
  // They will be ignored during static export
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*'
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors https: http:'
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM *'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400'
          }
        ]
      },
      {
        source: '/(.*).(jpg|jpeg|png|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*).(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  compress: true, // 압축 활성화
  poweredByHeader: false, // 'X-Powered-By' 헤더 비활성화
  productionBrowserSourceMaps: false, // 프로덕션용 소스맵 비활성화 (성능 향상)
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  // Fast Refresh 비활성화 (무한 루프 문제 해결)
  swcMinify: false,
  output: 'export',
  trailingSlash: true,
};

module.exports = nextConfig;