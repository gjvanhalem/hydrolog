import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  swcMinify: true,  experimental: {
    // Enable modern features
    serverActions: {
      // Use the default body size limit and allowed origins
      allowedOrigins: ["*"],
    },
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
