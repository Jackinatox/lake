import 'server-only';

import { auth } from '@/auth';
import { headers } from 'next/headers';

/**
 * Throws unless the caller has an admin session. Returns the session so actions can attribute
 * the change to the acting admin.
 */
export async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');
    return session;
}
