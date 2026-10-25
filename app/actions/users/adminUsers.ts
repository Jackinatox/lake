'use server';

import { auth } from '@/auth';
import { APIError } from 'better-auth/api';
import {
    adminCreateUserSchema,
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
import formatDate from '@/lib/formatDate';

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
                    { username: { contains: trimmed, mode: 'insensitive' } },
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

export async function createUserAsAdmin(input: {
    email: string;
    name?: string;
    password: string;
    emailVerified: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
    const session = await requireAdmin();
    const parsed = adminCreateUserSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getValidationMessage(parsed.error) };
    }
    const { email, password, emailVerified } = parsed.data;
    const name = parsed.data.name || email.split('@')[0];

    let userId: string;
    try {
        // The admin plugin endpoint creates the user plus a credential account; the
        // user.create hooks in auth.ts still run and provision the Pterodactyl account.
        const { user } = await auth.api.createUser({
            headers: await headers(),
            body: { email, password, name, data: { emailVerified } },
        });
        userId = user.id;
    } catch (error) {
        return {
            success: false,
            error: error instanceof APIError ? error.message : 'Failed to create user',
        };
    }

    await logger.info(`Admin ${session.user.email} created user ${email}`, 'SYSTEM', {
        userId: session.user.id,
        details: { targetUserId: userId, emailVerified },
    });

    // Sign-in rejects unverified emails without resending, so send the link right away.
    if (!emailVerified) {
        try {
            await auth.api.sendVerificationEmail({
                body: { email, callbackURL: '/gameserver' },
            });
        } catch (error) {
            await logger.error(`Failed to send verification email to ${email}`, 'SYSTEM', {
                userId: session.user.id,
                details: {
                    targetUserId: userId,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
            return {
                success: false,
                error: 'User created, but the verification email could not be sent',
            };
        }
    }

    return { success: true };
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
                createdAt: formatDate(ptUser.createdAt),
                updatedAt: formatDate(ptUser.updatedAt),
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch Pterodactyl user',
        };
    }
}
