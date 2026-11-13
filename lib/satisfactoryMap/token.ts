import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

import { isSaveFileName } from './saves';

/** How long an "open in interactive map" link keeps working. */
export const MAP_LINK_TTL_SECONDS = 24 * 60 * 60;

/** Origins of the hosted map (satisfactory-calculator.com) that may fetch the save. */
export const MAP_ORIGINS = [
    'https://satisfactory-calculator.com',
    'https://www.satisfactory-calculator.com',
];

const SERVER_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;
const EXPIRY_PATTERN = /^\d{1,12}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

function sign(payload: string): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');
    // The purpose prefix keeps these signatures from being valid for anything else signed with
    // the same secret.
    return createHmac('sha256', secret).update(`satisfactory-map:${payload}`).digest('base64url');
}

/**
 * Creates the token for `/api/satisfactory-map/<token>/save.sav`. It is stateless, so a link
 * can't be revoked before it expires.
 *
 * - `<ptServerId>.<expiry>.<hmac>`: always the newest save, so it follows new autosaves.
 * - `<ptServerId>.<expiry>.<base64url file name>.<hmac>`: exactly that save.
 */
export function createMapToken(ptServerId: string, file?: string, now = Date.now()) {
    const expiry = Math.floor(now / 1000) + MAP_LINK_TTL_SECONDS;
    const parts = [ptServerId, String(expiry)];
    if (file !== undefined) parts.push(Buffer.from(file, 'utf8').toString('base64url'));
    const payload = parts.join('.');
    return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(expiry * 1000) };
}

export type MapTokenResult =
    | { status: 'ok'; ptServerId: string; file: string | null }
    | { status: 'invalid' }
    | { status: 'expired' };

export function verifyMapToken(token: string, now = Date.now()): MapTokenResult {
    const parts = token.split('.');
    if (parts.length !== 3 && parts.length !== 4) return { status: 'invalid' };
    const signature = parts.pop()!;
    const [ptServerId, expiry, encodedFile] = parts;
    if (!SERVER_ID_PATTERN.test(ptServerId) || !EXPIRY_PATTERN.test(expiry)) {
        return { status: 'invalid' };
    }
    if (encodedFile !== undefined && !BASE64URL_PATTERN.test(encodedFile)) {
        return { status: 'invalid' };
    }

    const expected = Buffer.from(sign(parts.join('.')));
    const given = Buffer.from(signature);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
        return { status: 'invalid' };
    }

    if (Number(expiry) * 1000 <= now) return { status: 'expired' };

    if (encodedFile === undefined) return { status: 'ok', ptServerId, file: null };
    const file = Buffer.from(encodedFile, 'base64url').toString('utf8');
    // Signed by us, so this only guards against a bug on the signing side.
    if (!isSaveFileName(file)) return { status: 'invalid' };
    return { status: 'ok', ptServerId, file };
}

/** The hosted map URL that loads the save behind `token` (`?url=` remote loading). */
export function buildMapUrl(token: string, locale: string): string {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? '').replace(
        /\/$/,
        '',
    );
    if (!base) throw new Error('NEXT_PUBLIC_APP_URL is not set');
    const saveUrl = `${base}/api/satisfactory-map/${token}/save.sav`;
    const lang = locale === 'de' ? 'de' : 'en';
    return `https://satisfactory-calculator.com/${lang}/interactive-map?url=${encodeURIComponent(saveUrl)}`;
}
