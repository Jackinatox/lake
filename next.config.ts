// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { version } from './package.json';
const { execSync } = require('child_process');

const withNextIntl = createNextIntlPlugin(/* …your localeConfigPath if needed… */);

const nextConfig: NextConfig = {
    reactStrictMode: false,
    output: 'standalone',
    env: {
        NEXT_PUBLIC_APP_VERSION: version,
        NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.DEPLOYMENT_ENV,
        NEXT_PUBLIC_INSTANCE_ID: process.env.INSTANCE_ID,
        BUILD_DATE: new Date().toISOString(),
        GIT_COMMIT: sh('git rev-parse --short HEAD'),
        GIT_COMMIT_TIME: sh('git log -1 --format=%cI'),
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

function sh(cmd: string, fallback: string = 'unknown') {
    try {
        return execSync(cmd).toString().trim();
    } catch {
        return fallback; // e.g. shallow clone in CI without git history
    }
}

export default withNextIntl(nextConfig);
