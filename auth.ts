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
import { captureServerEvent } from './lib/posthog';

function extractIp(request?: Request | null): string | undefined {
    if (!request) return undefined;
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        undefined
    );
}

function extractUserAgent(request?: Request | null): string | undefined {
    return request?.headers.get('user-agent') || undefined;
}

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
            // Check if this was a password reset (via token) or password change (with current password)
            // Password reset comes from /reset-password endpoint, password change from /change-password
            const isPasswordChange = request?.url?.includes('/change-password');

            if (isPasswordChange) {
                await logger.info(
                    `Password for user ${user.email} has been changed.`,
                    'AUTHENTICATION',
                    { userId: user.id },
                );
                await sendPasswordResetSuccessEmail(
                    user.email,
                    `${env('NEXT_PUBLIC_APP_URL')}/profile`,
                    user.name || '',
                    'change',
                );
            } else {
                await logger.info(
                    `Password for user ${user.email} has been reset.`,
                    'AUTHENTICATION',
                    { userId: user.id },
                );
                await sendPasswordResetSuccessEmail(
                    user.email,
                    `${env('NEXT_PUBLIC_APP_URL')}/login`,
                    user.name || '',
                    'reset',
                );
            }
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }, request) => {
            await logger.info(`Verification email sent to ${user.email}`, 'AUTHENTICATION', {
                userId: user.id,
                ipAddress: extractIp(request),
                userAgent: extractUserAgent(request),
                details: { email: user.email },
            });
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
                    const req = (context as any)?.request as Request | undefined;
                    const ip = extractIp(req);
                    const ua = extractUserAgent(req);
                    const path = req ? new URL(req.url).pathname : undefined;

                    await logger.info(`New user signup attempt: ${user.email}`, 'AUTHENTICATION', {
                        ipAddress: ip,
                        userAgent: ua,
                        path,
                        details: { email: user.email, name: user.name },
                    });

                    captureServerEvent(user.email, 'user_signup_attempt', {
                        email: user.email,
                        ip,
                        userAgent: ua,
                        signupPath: path,
                    });

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

                        await logger.info(
                            `User account created successfully: ${user.email}`,
                            'AUTHENTICATION',
                            {
                                ipAddress: ip,
                                userAgent: ua,
                                details: {
                                    email: user.email,
                                    ptUsername,
                                    ptUserId: newPTUser.id,
                                },
                            },
                        );

                        captureServerEvent(user.email, 'user_signup_success', {
                            email: user.email,
                            ip,
                            userAgent: ua,
                            ptUsername,
                        });

                        return {
                            data: {
                                ...user,
                                ptUserId: newPTUser.id,
                                ptKey: newKey,
                                ptUsername: ptUsername,
                            },
                        };
                    } catch (error) {
                        await logger.error(
                            `Failed to create user: ${user.email}`,
                            'AUTHENTICATION',
                            {
                                ipAddress: ip,
                                userAgent: ua,
                                details: {
                                    email: user.email,
                                    error: error instanceof Error ? error.message : String(error),
                                },
                            },
                        );
                        captureServerEvent(user.email, 'user_signup_failed', {
                            email: user.email,
                            ip,
                            userAgent: ua,
                            error: error instanceof Error ? error.message : String(error),
                        });
                        throw new Error('Failed to create user');
                    }
                },
            },
        },
        session: {
            create: {
                after: async (session, context) => {
                    const req = (context as any)?.request as Request | undefined;
                    const ip = extractIp(req);
                    const ua = extractUserAgent(req);
                    const path = req ? new URL(req.url).pathname : undefined;

                    await logger.info(
                        `Session created for user ${session.userId}`,
                        'AUTHENTICATION',
                        {
                            userId: session.userId,
                            ipAddress: ip,
                            userAgent: ua,
                            path,
                            details: { sessionId: session.id },
                        },
                    );

                    captureServerEvent(session.userId, 'user_sign_in', {
                        userId: session.userId,
                        ip,
                        userAgent: ua,
                        signInPath: path,
                    });
                },
            },
        },
    },
});
