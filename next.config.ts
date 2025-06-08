// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(/* …your localeConfigPath if needed… */);

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  images: {
    // URL-based remotePatterns for Next.js 15+
    // remotePatterns: [
    //   new URL(
    //     
    //   ),
    // ],
  },
};

export default withNextIntl(nextConfig);
