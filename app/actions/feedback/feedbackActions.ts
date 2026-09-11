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

    if (parsed.ptGameServerId) {
        const server = await getOwnedGameServerSummary(session.user.id, parsed.ptGameServerId);
        if (!server) throw new Error('Unauthorized (No Gameserver found)');

        await logger.info('submitFeedbackAction called', 'SYSTEM', {
            userId: session.user.id,
            gameServerId: server.id,
            details: {
                input,
            }
        });
        
        return prisma.feedback.create({
            data: {
                type: parsed.type,
                title: parsed.title ?? null,
                message: parsed.message ?? null,
                data: parsed.data as Prisma.InputJsonValue,
                userId: session.user.id,
                gameServerId: server.id
            },
            select: {
                id: true,
                createdAt: true,
            },
        });
    } else {
        await logger.error('submitFeedbackAction called without ptGameServerId', 'SYSTEM', {
            userId: session.user.id,
            details: {
                input,
            }
        });
        throw new Error('Unauthorized (No Gameserver found)');

        throw new Error('Unauthorized (No Gameserver found)');
    }
}

export type MyFeedbackRow = {
    id: number;
    type: FeedbackType;
    title: string | null;
    message: string | null;
    data: unknown;
    createdAt: Date;
};

export async function getMyFeedbackAction(gameServerId: string): Promise<MyFeedbackRow[]> {
    const session = await requireSession();

    const parsedServerId = (() => {
        try {
            return serverIdentifierSchema.parse(gameServerId);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    return prisma.feedback.findMany({
        where: {
            userId: session.user.id,
            gameServerId: parsedServerId,
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
