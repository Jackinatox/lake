import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { isDevServer, isLoopbackUrl } from '@/lib/devMode';
import prisma from '@/lib/prisma';

/** Shared password of every agent persona, so the login form can be tested with it as well. */
const AGENT_PASSWORD = 'agent-dev-password';
const SLUG_PATTERN = /^[a-z0-9-]{1,32}$/;

/**
 * Dev only (`next dev`): logs in as an agent test user, creating it on first use, and redirects.
 *
 *   GET /api/dev/login                          → user "agent", role user, to /gameserver
 *   GET /api/dev/login?role=admin               → user "agent-admin", role admin
 *   GET /api/dev/login?user=buyer2&redirect=/x  → user "buyer2", to /x
 *
 * Every call resets the persona to a state that can log in (verified, unbanned, no 2FA, known
 * password, requested role). 404 outside `next dev` and on non-localhost hosts.
 * See docs/dev-agent-login.md.
 */
export async function GET(req: NextRequest) {
    // Loopback only: a dev server can also be reachable via its LAN IP or a public dev domain,
    // and this route hands out an admin session to anyone who opens it.
    if (!isDevServer || !isLoopbackUrl(`http://${req.headers.get('host')}`)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const params = req.nextUrl.searchParams;
    const role = params.get('role') === 'admin' ? 'admin' : 'user';
    const slug = params.get('user') ?? (role === 'admin' ? 'agent-admin' : 'agent');
    if (!SLUG_PATTERN.test(slug)) {
        return NextResponse.json({ error: 'user must match [a-z0-9-]{1,32}' }, { status: 400 });
    }
    const redirectParam = params.get('redirect') ?? '/gameserver';
    // Same-origin paths only: "/x" but not "//evil.com" or "/\evil.com".
    const redirectTo = /^\/(?![/\\])/.test(redirectParam) ? redirectParam : '/gameserver';

    const email = `${slug}@example.com`;
    const passwordHash = await hashPassword(AGENT_PASSWORD);

    // Written with Prisma instead of Better Auth so the signup hooks in auth.ts (PT account,
    // Telegram, PostHog) stay out of it. The PT account is still provisioned on the first
    // session by the session.create.after hook, if the dev panel is reachable.
    const user = await prisma.user.upsert({
        where: { email },
        create: {
            id: randomUUID(),
            email,
            name: `Agent ${slug}`,
            username: slug.replace(/-/g, '_'),
            displayUsername: slug,
            emailVerified: true,
            role,
        },
        update: {
            emailVerified: true,
            role,
            banned: false,
            banReason: null,
            banExpires: null,
            twoFactorEnabled: false,
        },
        select: { id: true },
    });
    await prisma.twoFactor.deleteMany({ where: { userId: user.id } });

    const credential = await prisma.account.findFirst({
        where: { userId: user.id, providerId: 'credential' },
        select: { id: true },
    });
    if (credential) {
        await prisma.account.update({
            where: { id: credential.id },
            data: { password: passwordHash },
        });
    } else {
        await prisma.account.create({
            data: {
                id: randomUUID(),
                accountId: user.id,
                providerId: 'credential',
                userId: user.id,
                password: passwordHash,
            },
        });
    }

    const signIn = await auth.api.signInEmail({
        body: { email, password: AGENT_PASSWORD },
        headers: req.headers,
        asResponse: true,
    });
    if (!signIn.ok) {
        return NextResponse.json(
            { error: 'Sign-in failed', status: signIn.status, body: await signIn.text() },
            { status: 500 },
        );
    }

    const response = NextResponse.redirect(new URL(redirectTo, req.nextUrl.origin));
    for (const cookie of signIn.headers.getSetCookie()) {
        response.headers.append('set-cookie', cookie);
    }
    return response;
}
