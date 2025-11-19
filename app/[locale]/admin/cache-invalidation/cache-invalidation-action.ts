'use server';

import { auth } from '@/auth';
import { headers } from 'next/headers';
import { updateTag } from 'next/cache';

export async function invalidateCacheAction(keys: string[]) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }

    for (const key of keys) {
        try {
            updateTag(key);
        } catch (error) {
            console.error(`Failed to invalidate cache tag: ${key}`, error);
        }
    }

    return {
        success: true,
        invalidatedKeys: keys,
    };
}
