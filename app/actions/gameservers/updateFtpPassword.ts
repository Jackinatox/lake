'use server';

import { headers } from 'next/headers';
import { randomBytes } from 'crypto';

import { auth } from '@/auth';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { prisma } from '@/prisma';
import { FTP_PASSWORD_MAX_LENGTH, FTP_PASSWORD_MIN_LENGTH } from '@/app/GlobalConstants';

function generateRandomPassword(length: number = 24) {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%^&*()-_=+';
    const bytes = randomBytes(length);
    let password = '';

    for (let i = 0; i < length; i += 1) {
        password += charset[bytes[i] % charset.length];
    }

    return password;
}

interface UpdateFtpPasswordArgs {
    serverIdentifier: string;
    password?: string;
}

interface UpdateFtpPasswordResult {
    success: boolean;
    password?: string;
    error?: string;
}

export async function updateFtpPassword({
    serverIdentifier,
    password,
}: UpdateFtpPasswordArgs): Promise<UpdateFtpPasswordResult> {
    if (!serverIdentifier) {
        return { success: false, error: 'Missing server identifier.' };
    }

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey || !session.user.ptUserId) {
        return { success: false, error: 'You must be signed in to change the FTP password.' };
    }

    const gameServer = await prisma.gameServer.findFirst({
        where: {
            ptServerId: serverIdentifier,
            userId: session.user.id,
        },
    });

    if (!gameServer) {
        return { success: false, error: 'Server not found.' };
    }
    const trimmedPassword = password?.trim();

    const finalPassword =
        trimmedPassword && trimmedPassword.length > 0 ? trimmedPassword : generateRandomPassword();

    if (
        finalPassword.length < FTP_PASSWORD_MIN_LENGTH ||
        finalPassword.length > FTP_PASSWORD_MAX_LENGTH
    ) {
        return {
            success: false,
            error: `Password must be between ${FTP_PASSWORD_MIN_LENGTH} and ${FTP_PASSWORD_MAX_LENGTH} characters long.`,
        };
    }

    try {
        const adminClient = createPtClient();
        const panelUser = await adminClient.getUser(session.user.ptUserId.toString());
        await panelUser.setPassword(finalPassword);

        return { success: true, password: finalPassword };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update FTP password.';
        return { success: false, error: message };
    }
}
