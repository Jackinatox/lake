/**
 * True only under `next dev`. Next inlines NODE_ENV into client bundles too, so this is safe to
 * use in client components. Deliberately NOT based on DEPLOYMENT_ENV: anything that weakens auth
 * (no captcha, the agent login route) must be impossible on a built server, and a production
 * build always has NODE_ENV=production. See docs/dev-agent-login.md.
 */
export const isDevServer = process.env.NODE_ENV === 'development';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** Whether a URL/origin points at this machine (`http://localhost:3005`, `http://127.0.0.1`). */
export function isLoopbackUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
        return LOOPBACK_HOSTNAMES.has(new URL(url).hostname);
    } catch {
        return false;
    }
}
