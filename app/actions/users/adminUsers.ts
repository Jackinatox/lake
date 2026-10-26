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
import deletePtUser from '@/lib/Pterodactyl/deletePtUser';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';
import formatDate from '@/lib/formatDate';

async function requireAdmin(action: string) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (session?.user.role !== 'admin') {
        await logger.warn(`Unauthorized attempt to call admin action ${action}`, 'SYSTEM', {
            userId: session?.user.id,
            ipAddress: requestHeaders.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
            userAgent: requestHeaders.get('user-agent') || undefined,
            details: { action },
        });
        throw new Error('Unauthorized');
    }
    return session;
}

export async function searchUsers(query: string) {
    await requireAdmin('searchUsers');
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
    const session = await requireAdmin('createUserAsAdmin');
    const parsed = adminCreateUserSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getValidationMessage(parsed.error) };
    }
    const { email, password, emailVerified } = parsed.data;
    const name = parsed.data.name || email.split('@')[0];

    // Checked up front so the rollback below can safely assume any user with this email is
    // the one this call created.
    const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
    });
    if (existing) {
        return { success: false, error: 'A user with this email already exists' };
    }

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
        await logger.error(`Admin ${session.user.email} failed to create user ${email}`, 'SYSTEM', {
            userId: session.user.id,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        await rollbackFailedUserCreation(email, session.user.id);
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

/**
 * Cleans up after a failed `auth.api.createUser`. Creation is not atomic: the Pterodactyl
 * account is provisioned in a hook before the DB insert, and the credential account is linked
 * after it, so a failure can leave a user without a password or a panel user without a row.
 */
async function rollbackFailedUserCreation(email: string, adminId: string) {
    try {
        const leftover = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            select: { id: true, ptUserId: true },
        });
        if (!leftover) {
            // The DB insert failed; any panel user created by the hook can't be matched to this
            // call, so it is left for manual cleanup instead of risking deleting someone else's.
            await logger.warn(
                `No user row left after failed creation of ${email}; check the panel for an orphaned user`,
                'SYSTEM',
                { userId: adminId, details: { email } },
            );
            return;
        }

        if (leftover.ptUserId) {
            await deletePtUser(leftover.ptUserId);
        }
        await prisma.user.delete({ where: { id: leftover.id } });
        await logger.info(`Rolled back partially created user ${email}`, 'SYSTEM', {
            userId: adminId,
            details: { targetUserId: leftover.id, ptUserId: leftover.ptUserId },
        });
    } catch (error) {
        await logger.error(`Rollback of failed user creation for ${email} failed`, 'SYSTEM', {
            userId: adminId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
    }
}

export async function verifyUserEmail(userId: string) {
    const session = await requireAdmin('verifyUserEmail');
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
    const session = await requireAdmin('toggleBanUser');
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
    await requireAdmin('getPterodactylUserInfo');
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
