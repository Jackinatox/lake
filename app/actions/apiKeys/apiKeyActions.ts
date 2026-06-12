'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import {
    type ApiKeyPermission,
    ADMIN_ONLY_PERMISSIONS,
    permissionsToRecord,
} from '@/lib/apiKeyPermissions';
import { createApiKeySchema } from '@/lib/validation/adminContent';
import { getValidationMessage, nonEmptyIdSchema } from '@/lib/validation/common';
import { headers } from 'next/headers';

async function requireSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Not authenticated');
    return session;
}

async function requireAdmin() {
    const session = await requireSession();
    if (session.user.role !== 'admin') throw new Error('Not authorized');
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
    // Any authenticated user may create a key, but only an admin may grant
    // admin-only permissions (prometheus, status, financials, …).
    const session = await requireSession();
    const parsed = (() => {
        try {
            return createApiKeySchema.parse(opts);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    if (session.user.role !== 'admin') {
        const forbidden = parsed.permissions.filter((p) => ADMIN_ONLY_PERMISSIONS.includes(p));
        if (forbidden.length > 0) {
            throw new Error('Not authorized to assign these permissions');
        }
    }

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
