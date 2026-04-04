// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { version } from './package.json';

const withNextIntl = createNextIntlPlugin(/* …your localeConfigPath if needed… */);

const nextConfig: NextConfig = {
    reactStrictMode: false,
    output: 'standalone',
    env: {
        NEXT_PUBLIC_APP_VERSION: version,
        NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.DEPLOYMENT_ENV,
        NEXT_PUBLIC_INSTANCE_ID: process.env.INSTANCE_ID,
    },
    images: {
        // URL-based remotePatterns for Next.js 15+
        // remotePatterns: [
        //   new URL(
        //
        //   ),
        // ],
    },
    allowedDevOrigins: ['localhost:3000', 'scyed.com', 'devlake.scyed.com'],
};

export default withNextIntl(nextConfig);
