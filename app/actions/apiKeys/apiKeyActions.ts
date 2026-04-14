'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { type ApiKeyPermission, permissionsToRecord } from '@/lib/apiKeyPermissions';
import { createApiKeySchema } from '@/lib/validation/adminContent';
import { getValidationMessage, nonEmptyIdSchema } from '@/lib/validation/common';
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

export interface CreateApiKeyOptions {
    name: string;
    permissions: ApiKeyPermission[];
    /** Max requests allowed in the time window. */
    rateLimitMax: number;
    /** Time window in milliseconds. */
    rateLimitTimeWindow: number;
}

export async function createApiKeyAction(opts: CreateApiKeyOptions) {
    const session = await requireAdmin();
    const parsed = (() => {
        try {
            return createApiKeySchema.parse(opts);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    // permissions and userId are server-only fields — call without headers
    // so better-auth uses the internal (server) code path.
    const result = (await auth.api.createApiKey({
        body: {
            name: parsed.name,
            permissions: permissionsToRecord(parsed.permissions),
            userId: session.user.id,
            rateLimitEnabled: true,
            rateLimitMax: parsed.rateLimitMax,
            rateLimitTimeWindow: parsed.rateLimitTimeWindow,
        },
    })) as { id: string; key: string; name: string | null };

    // Persist last 6 chars + rate limit settings (not exposed by createApiKey body).
    const lastChars = result.key.slice(-6);
    await prisma.apikey.update({
        where: { id: result.id },
        data: {
            metadata: JSON.stringify({ lastChars }),
        },
    });

    return { id: result.id, key: result.key, name: result.name };
}

export async function deleteApiKeyAction(keyId: string) {
    await requireAdmin();
    await prisma.apikey.delete({ where: { id: nonEmptyIdSchema.parse(keyId) } });
}
