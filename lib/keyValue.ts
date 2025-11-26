import prisma from '@/lib/prisma';

import { cache } from 'react';

/**
 * Fetches a single key-value string from the database
 * This function is cached per request to avoid duplicate database queries
 * 
 * @param key - The unique key to fetch from the KeyValue table
 * @returns The string value associated with the key, or null if not found
 */
export const getKeyValueString = cache(async (key: string): Promise<string | null> => {
    try {
        const keyValue = await prisma.keyValue.findUnique({
            where: { key },
        });
        return keyValue?.string || null;
    } catch (error) {
        console.error(`Failed to fetch key-value for key: ${key}`, error);
        return null;
    }
});

export const getKeyValueNumber = cache(async (key: string): Promise<number> => {
    try {
        const keyValue = await prisma.keyValue.findUnique({
            where: { key },
        });
        return keyValue?.number || 0;
    } catch (error) {
        console.error(`Failed to fetch key-value for key: ${key}`, error);
        return 0;
    }
});
