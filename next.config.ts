/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Tạm thời bỏ qua lỗi TypeScript khi build
    ignoreBuildErrors: true,
  },
  // Cấu hình cho WebSocket HMR
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (dev && !isServer) {
      // Cấu hình WebSocket cho HMR
      config.devServer = {
        ...config.devServer,
        host: '0.0.0.0',
        port: 3030,
        allowedHosts: 'all',
        client: {
          webSocketURL: {
            hostname: 'amnhactechcf.ddns.net',
            pathname: '/_next/webpack-hmr',
            port: 3030,
            protocol: 'ws',
          },
        },
      };
    }

    // Thêm fallbacks cho Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    return config;
  },
  // Cấu hình server cho development
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
