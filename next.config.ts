import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://www.googletagmanager.com; connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://www.google-analytics.com https://generativelanguage.googleapis.com; img-src 'self' blob: data: https://api.mapbox.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://api.mapbox.com; font-src 'self' data:;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
