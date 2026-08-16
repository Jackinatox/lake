import prisma from '@/lib/prisma';

import { cache } from 'react';
import { logger } from './logger';

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
        logger.error(`Failed to fetch key-value for key: ${key}`, 'SYSTEM');
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
        logger.error(`Failed to fetch key-value for key: ${key}`, 'SYSTEM');
        return 0;
    }
});

export const getKeyValueBoolean = cache(
    async (key: string, defaultValue: boolean): Promise<boolean> => {
        try {
            const keyValue = await prisma.keyValue.findUnique({
                where: { key },
            });
            return keyValue?.boolean ?? defaultValue;
        } catch (error) {
            logger.error(`Failed to fetch key-value for key: ${key}`, 'SYSTEM');
            return defaultValue;
        }
    },
);

/**
 * Reads a boolean key-value straight from the database, bypassing the
 * per-request `cache()` wrappers above. Use this for kill switches that must
 * take effect immediately, e.g. right before provisioning a server.
 */
export async function getKeyValueBooleanFresh(
    key: string,
    defaultValue: boolean,
): Promise<boolean> {
    try {
        const keyValue = await prisma.keyValue.findUnique({
            where: { key },
        });
        return keyValue?.boolean ?? defaultValue;
    } catch (error) {
        logger.error(`Failed to fetch key-value for key: ${key}`, 'SYSTEM');
        return defaultValue;
    }
}
