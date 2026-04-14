'use server';

import { auth } from '@/auth';
import {
    adminUserSearchSchema,
    pterodactylUserInfoSchema,
    toggleBanUserSchema,
    verifyUserEmailSchema,
} from '@/lib/validation/adminContent';
import { getValidationMessage } from '@/lib/validation/common';
import prisma from '@/lib/prisma';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function searchUsers(query: string) {
    await requireAdmin();
    const parsed = (() => {
        try {
            return adminUserSearchSchema.parse({ query });
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();
    const trimmed = parsed.query.trim();

    // If empty query, return first 25 users
    if (!trimmed) {
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                take: 25,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { GameServer: true } } },
            }),
            prisma.user.count(),
        ]);
        return { users, total };
    }

    // Try numeric match for ptUserId
    const numericQuery = /^\d+$/.test(trimmed) ? Number(trimmed) : null;

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: trimmed, mode: 'insensitive' } },
                    { id: { contains: trimmed, mode: 'insensitive' } },
                    { name: { contains: trimmed, mode: 'insensitive' } },
                    { ptUsername: { contains: trimmed, mode: 'insensitive' } },
                    ...(numericQuery != null ? [{ ptUserId: numericQuery }] : []),
                ],
            },
            take: 25,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { GameServer: true } } },
        }),
        prisma.user.count(),
    ]);

    return { users, total };
}

export async function verifyUserEmail(userId: string) {
    const session = await requireAdmin();
    const parsed = (() => {
        try {
            return verifyUserEmailSchema.parse({ userId });
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    await prisma.user.update({
        where: { id: parsed.userId },
        data: { emailVerified: true },
    });

    await logger.info(
        `Admin ${session.user.email} verified email for user ${parsed.userId}`,
        'SYSTEM',
        {
            userId: session.user.id,
            details: { targetUserId: parsed.userId },
        },
    );

    return { success: true };
}

export async function toggleBanUser(userId: string, ban: boolean, reason?: string) {
    const session = await requireAdmin();
    const parsed = (() => {
        try {
            return toggleBanUserSchema.parse({ userId, ban, reason });
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    await prisma.user.update({
        where: { id: parsed.userId },
        data: {
            banned: parsed.ban,
            banReason: parsed.ban ? parsed.reason || 'Banned by admin' : null,
        },
    });

    await logger.info(
        `Admin ${session.user.email} ${parsed.ban ? 'banned' : 'unbanned'} user ${parsed.userId}`,
        'SYSTEM',
        {
            userId: session.user.id,
            details: { targetUserId: parsed.userId, ban: parsed.ban, reason: parsed.reason },
        },
    );

    return { success: true };
}

export async function getPterodactylUserInfo(ptUserId: number) {
    await requireAdmin();
    const parsed = (() => {
        try {
            return pterodactylUserInfoSchema.parse({ ptUserId });
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    try {
        const client = createPtClient();
        const ptUser = await client.getUser(parsed.ptUserId.toString());

        return {
            success: true,
            data: {
                id: ptUser.id,
                externalId: ptUser.externalId,
                uuid: ptUser.uuid,
                username: ptUser.username,
                email: ptUser.email,
                firstName: ptUser.firstName,
                lastName: ptUser.lastName,
                language: ptUser.language,
                rootAdmin: ptUser.rootAdmin,
                twoFactor: ptUser.twoFactor,
                createdAt: String(ptUser.createdAt),
                updatedAt: String(ptUser.updatedAt),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch Pterodactyl user',
        };
    }
}
