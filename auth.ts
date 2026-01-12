import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, lastLoginMethod, twoFactor } from 'better-auth/plugins';
import { env } from 'next-runtime-env';
import generateUniqueUserName from './lib/auth/generateUniqueUserName';
import { createPtClient } from './lib/Pterodactyl/ptAdminClient';
import createUserApiKey from './lib/Pterodactyl/userApiKey';
import {
    sendConfirmEmail,
    sendPasswordResetSuccessEmail,
    sendResetPasswordEmail,
} from './lib/email/sendEmailEmailsFromLake';
import prisma from './lib/prisma';
import { logger } from './lib/logger';

function generateRandomPassword(length: number = 32): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['discord', 'google'],
        },
    },
    user: {
        additionalFields: {
            ptUserId: {
                type: 'number',
                optional: true,
                required: false,
            },
            ptKey: {
                type: 'string',
                optional: true,
                required: false,
            },
            stripeUserId: {
                type: 'string',
                optional: true,
                required: false,
            },
            ptUsername: {
                type: 'string',
                optional: true,
                required: false,
            },
        },
    },
    socialProviders: {
        discord: {
            clientId: env('DISCORD_CLIENT_ID')!,
            clientSecret: env('DISCORD_CLIENT_SECRET')!,
        },
        google: {
            clientId: env('GOOGLE_CLIENT_ID')!,
            clientSecret: env('GOOGLE_CLIENT_SECRET')!,
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            await sendResetPasswordEmail(user.email, url, token);
        },
        onPasswordReset: async ({ user }, request) => {
            await logger.info(`Password for user ${user.email} has been reset.`, 'AUTHENTICATION');
            await sendPasswordResetSuccessEmail(
                user.email,
                `${env('NEXT_PUBLIC_APP_URL')}/login`,
                user.name || '',
            );
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }, request) => {
            await sendConfirmEmail(user.email, url);
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
    },
    plugins: [
        twoFactor(),
        lastLoginMethod({
            storeInDatabase: true,
        }),
        admin(),
    ],
    databaseHooks: {
        user: {
            create: {
                before: async (user, context) => {
                    try {
                        const ptAdmin = createPtClient();
                        const ptUsername = await generateUniqueUserName(user.email);

                        const newPTUser = await ptAdmin.createUser({
                            firstName: user.name,
                            lastName: 'Scyed',
                            username: ptUsername,
                            email: user.email,
                            password: generateRandomPassword(),
                            externalId: user.id,
                        });

                        const newKey = await createUserApiKey(newPTUser.id);
                        return {
                            data: {
                                ...user,
                                ptUserId: newPTUser.id,
                                ptKey: newKey,
                                ptUsername: ptUsername,
                            },
                        };
                    } catch (error) {
                        console.error('Error creating user:', error);
                        throw new Error('Failed to create user');
                    }
                },
            },
        },
    },
});
