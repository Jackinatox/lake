'use server';

import { auth } from '@/auth';
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

    const trimmed = query.trim();

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
    const numericQuery = parseInt(trimmed, 10);
    const isNumeric = !isNaN(numericQuery);

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: trimmed, mode: 'insensitive' } },
                    { id: { contains: trimmed, mode: 'insensitive' } },
                    { name: { contains: trimmed, mode: 'insensitive' } },
                    { ptUsername: { contains: trimmed, mode: 'insensitive' } },
                    ...(isNumeric ? [{ ptUserId: numericQuery }] : []),
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

    await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
    });

    await logger.info(`Admin ${session.user.email} verified email for user ${userId}`, 'SYSTEM', {
        userId: session.user.id,
        details: { targetUserId: userId },
    });

    return { success: true };
}

export async function toggleBanUser(userId: string, ban: boolean, reason?: string) {
    const session = await requireAdmin();

    await prisma.user.update({
        where: { id: userId },
        data: {
            banned: ban,
            banReason: ban ? reason || 'Banned by admin' : null,
        },
    });

    await logger.info(
        `Admin ${session.user.email} ${ban ? 'banned' : 'unbanned'} user ${userId}`,
        'SYSTEM',
        {
            userId: session.user.id,
            details: { targetUserId: userId, ban, reason },
        },
    );

    return { success: true };
}

export async function getPterodactylUserInfo(ptUserId: number) {
    await requireAdmin();

    try {
        const client = createPtClient();
        const ptUser = await client.getUser(ptUserId.toString());

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
