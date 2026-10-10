'use server';

import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import { type Prisma } from '@/app/client/generated/client';
import { type FeedbackType } from '@/app/client/generated/enums';
import prisma from '@/lib/prisma';
import { getValidationMessage, serverIdentifierSchema } from '@/lib/validation/common';
import { submitFeedbackSchema, type SubmitFeedbackInput } from '@/lib/validation/feedback';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

async function requireSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Unauthorized');
    return session;
}

export type SubmittedFeedback = {
    id: number;
    createdAt: Date;
};

export async function submitFeedbackAction(input: SubmitFeedbackInput): Promise<SubmittedFeedback> {
    const session = await requireSession();

    const parsed = (() => {
        try {
            return submitFeedbackSchema.parse(input);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    // Feedback is bound to the GameServer row by its primary key, while the client
    // only ever knows the Pterodactyl identifier - resolve (and authorize) it here.
    const server = await getOwnedGameServerSummary(session.user.id, parsed.ptGameServerId);
    if (!server) {
        await logger.error('submitFeedbackAction called for a non-owned gameserver', 'SYSTEM', {
            userId: session.user.id,
            details: { input },
        });
        throw new Error('Unauthorized (No Gameserver found)');
    }

    await logger.info('submitFeedbackAction called', 'SYSTEM', {
        userId: session.user.id,
        gameServerId: server.id,
        details: { input },
    });

    return prisma.feedback.create({
        data: {
            type: parsed.type,
            title: parsed.title ?? null,
            message: parsed.message ?? null,
            data: parsed.data as Prisma.InputJsonValue,
            userId: session.user.id,
            gameServerId: server.id,
        },
        select: {
            id: true,
            createdAt: true,
        },
    });
}

export type MyFeedbackRow = {
    id: number;
    type: FeedbackType;
    title: string | null;
    message: string | null;
    data: unknown;
    createdAt: Date;
};

export async function getMyFeedbackAction(ptGameServerId: string): Promise<MyFeedbackRow[]> {
    const session = await requireSession();

    const parsedServerId = (() => {
        try {
            return serverIdentifierSchema.parse(ptGameServerId);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    const server = await getOwnedGameServerSummary(session.user.id, parsedServerId);
    if (!server) throw new Error('Unauthorized (No Gameserver found)');

    return prisma.feedback.findMany({
        where: {
            userId: session.user.id,
            gameServerId: server.id,
        },
        select: {
            id: true,
            type: true,
            title: true,
            message: true,
            data: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
}
