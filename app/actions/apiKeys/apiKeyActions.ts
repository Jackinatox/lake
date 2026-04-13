'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { type ApiKeyPermission } from '@/lib/apiKeyPermissions';
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
    await requireAdmin();

    const result = await auth.api.createApiKey({
        body: {
            name,
            metadata: { permissions },
        },
        headers: await headers(),
    });

    // The plugin returns the full key value here — only opportunity to surface it.
    return result as { id: string; key: string; name: string | null; start: string | null };
}

export async function deleteApiKeyAction(keyId: string) {
    await requireAdmin();
    await prisma.apikey.delete({ where: { id: keyId } });
}
