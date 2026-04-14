import { auth } from '@/auth';
import { headers } from 'next/headers';
import { type ApiKeyPermission, permissionsToRecord } from '@/lib/apiKeyPermissions';

/**
 * Guard an API route with either a valid API key or an admin session.
 *
 * Returns `null` if authorized, or a `Response` to send back if not.
 *
 * @example
 * export async function GET(req: Request) {
 *     const denied = await requireApiKeyOrAdmin(req, ApiKeyPermission.READ_PROMETHEUS_METRICS);
 *     if (denied) return denied;
 *     // … authorized
 * }
 */
export async function requireApiKeyOrAdmin(
    req: Request,
    permission: ApiKeyPermission,
): Promise<Response | null> {
    const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (bearer) {
        const { valid } = (await auth.api.verifyApiKey({
            body: {
                key: bearer,
                permissions: permissionsToRecord([permission]),
            },
        })) as { valid: boolean };
        return valid ? null : new Response('Forbidden\n', { status: 403 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role === 'admin') return null;

    return new Response('Unauthorized\n', { status: 401 });
}
