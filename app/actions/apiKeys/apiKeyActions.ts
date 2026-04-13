'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { type ApiKeyPermission, permissionsToRecord } from '@/lib/apiKeyPermissions';
import { headers } from 'next/headers';

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Not authorized');
    return session;
}

export async function listApiKeysAction() {
    await requireAdmin();
    return prisma.apikey.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createApiKeyAction(name: string, permissions: ApiKeyPermission[]) {
    const session = await requireAdmin();

    // permissions and userId are server-only fields — call without headers
    // so better-auth uses the internal (server) code path.
    const result = (await auth.api.createApiKey({
        body: {
            name,
            permissions: permissionsToRecord(permissions),
            userId: session.user.id,
        },
    })) as { id: string; key: string; name: string | null };

    // Persist the last 4 characters so the admin table can identify keys
    // without ever exposing the full value again.
    const lastChars = result.key.slice(-4);
    await prisma.apikey.update({
        where: { id: result.id },
        data: { metadata: JSON.stringify({ lastChars }) },
    });

    return { id: result.id, key: result.key, name: result.name };
}

export async function deleteApiKeyAction(keyId: string) {
    await requireAdmin();
    await prisma.apikey.delete({ where: { id: keyId } });
}
