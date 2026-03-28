import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, lastLoginMethod, twoFactor, captcha } from 'better-auth/plugins';
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
    logger: {
        log: (level, message, ...args) => {
            const context = args[0] && typeof args[0] === 'object' ? args[0] : undefined;
            // Better Auth log levels: debug, info, warn, error
            // Custom logger levels: TRACE, INFO, WARN, ERROR, FATAL (no DEBUG, so debug maps to TRACE)
            switch (level) {
                case 'error':
                    logger.error(message, 'AUTH', context).catch((err) => console.error('[AUTH logger] Failed to write error log:', err));
                    break;
                case 'warn':
                    logger.warn(message, 'AUTH', context).catch((err) => console.error('[AUTH logger] Failed to write warn log:', err));
                    break;
                case 'debug':
                    logger.trace(message, 'AUTH', context).catch((err) => console.error('[AUTH logger] Failed to write debug log:', err));
                    break;
                default:
                    logger.info(message, 'AUTH', context).catch((err) => console.error('[AUTH logger] Failed to write info log:', err));
            }
        },
    },
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
        captcha({
            provider: 'cloudflare-turnstile',
            secretKey: env('CF_TURNSTILE_SECRET_KEY')!,
        }),
    ],
    databaseHooks: {
        user: {
            create: {
                before: async (user, context) => {
                    const req = (context as any)?.request as Request | undefined;
                    const ip = extractIp(req);
                    const ua = extractUserAgent(req);
                    const path = req ? new URL(req.url).pathname : undefined;

                    // Email/password signups: defer PT account creation until email is verified
                    const isEmailSignup = path?.includes('/sign-up/email');

                    await logger.info(`New user signup attempt: ${user.email}`, 'AUTHENTICATION', {
                        ipAddress: ip,
                        userAgent: ua,
                        path,
                        details: { email: user.email, name: user.name, isEmailSignup },
                    });

                    captureServerEvent(user.email, 'user_signup_attempt', {
                        email: user.email,
                        ip,
                        userAgent: ua,
                        signupPath: path,
                        isEmailSignup,
                    });

                    if (isEmailSignup) {
                        // PT account will be provisioned in session.create.after once email is verified
                        return { data: user };
                    }

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

                    // Provision PT account for email-verified users who don't have one yet
                    const dbUser = await prisma.user.findUnique({
                        where: { id: session.userId },
                        select: { ptUserId: true, email: true, name: true },
                    });

                    if (dbUser && !dbUser.ptUserId) {
                        try {
                            const ptAdmin = createPtClient();
                            const ptUsername = await generateUniqueUserName(dbUser.email);

                            const newPTUser = await ptAdmin.createUser({
                                firstName: dbUser.name,
                                lastName: 'Scyed',
                                username: ptUsername,
                                email: dbUser.email,
                                password: generateRandomPassword(),
                                externalId: session.userId,
                            });

                            const newKey = await createUserApiKey(newPTUser.id);

                            await prisma.user.update({
                                where: { id: session.userId },
                                data: {
                                    ptUserId: newPTUser.id,
                                    ptKey: newKey,
                                    ptUsername,
                                },
                            });

                            await logger.info(
                                `PT account provisioned after email verification: ${dbUser.email}`,
                                'AUTHENTICATION',
                                {
                                    userId: session.userId,
                                    ipAddress: ip,
                                    userAgent: ua,
                                    details: {
                                        email: dbUser.email,
                                        ptUsername,
                                        ptUserId: newPTUser.id,
                                    },
                                },
                            );

                            captureServerEvent(session.userId, 'user_signup_success', {
                                email: dbUser.email,
                                ip,
                                userAgent: ua,
                                ptUsername,
                            });
                        } catch (error) {
                            await logger.error(
                                `Failed to provision PT account after email verification: ${dbUser.email}`,
                                'AUTHENTICATION',
                                {
                                    userId: session.userId,
                                    ipAddress: ip,
                                    userAgent: ua,
                                    details: {
                                        email: dbUser.email,
                                        error:
                                            error instanceof Error ? error.message : String(error),
                                    },
                                },
                            );
                        }
                    }
                },
            },
        },
    },
});
