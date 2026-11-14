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

/** Path of the player-facing share page; the middleware adds the visitor's locale. */
export const SHARE_PAGE_PATH = '/satisfactory-calculator-map';

const SHARE_PREFIX = 's';
const LINK_ID_PATTERN = /^[a-z0-9]{1,64}$/;
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

function signShare(linkId: string): string {
    const secret = process.env.MAP_SHARE_SECRET;
    if (!secret) throw new Error('MAP_SHARE_SECRET is not set');
    // Own secret, so rotating BETTER_AUTH_SECRET doesn't break every shared link.
    return createHmac('sha256', secret)
        .update(`satisfactory-map-share:${linkId}`)
        .digest('base64url');
}

/**
 * Token of a server's share link (`MapShareLink`): `s.<linkId>.<hmac>`. No expiry; it works
 * while the row exists with `revokedAt = null`. Recomputed from the id, so nothing secret is
 * stored in the database.
 */
export function createShareToken(linkId: string): string {
    return `${SHARE_PREFIX}.${linkId}.${signShare(linkId)}`;
}

export type MapTokenResult =
    | { status: 'ok'; kind: 'owner'; ptServerId: string; file: string | null }
    | { status: 'ok'; kind: 'share'; linkId: string }
    | { status: 'invalid' }
    | { status: 'expired' };

function verifyShareToken(parts: string[]): MapTokenResult {
    if (parts.length !== 3) return { status: 'invalid' };
    const [, linkId, signature] = parts;
    if (!LINK_ID_PATTERN.test(linkId)) return { status: 'invalid' };
    const expected = Buffer.from(signShare(linkId));
    const given = Buffer.from(signature);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
        return { status: 'invalid' };
    }
    return { status: 'ok', kind: 'share', linkId };
}

export function verifyMapToken(token: string, now = Date.now()): MapTokenResult {
    const parts = token.split('.');
    // Pterodactyl server ids are UUIDs, so "s" can't be the start of an owner token.
    if (parts[0] === SHARE_PREFIX) return verifyShareToken(parts);
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

    if (encodedFile === undefined) return { status: 'ok', kind: 'owner', ptServerId, file: null };
    const file = Buffer.from(encodedFile, 'base64url').toString('utf8');
    // Signed by us, so this only guards against a bug on the signing side.
    if (!isSaveFileName(file)) return { status: 'invalid' };
    return { status: 'ok', kind: 'owner', ptServerId, file };
}

function appBaseUrl(): string {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? '').replace(
        /\/$/,
        '',
    );
    if (!base) throw new Error('NEXT_PUBLIC_APP_URL is not set');
    return base;
}

/** The hosted map URL that loads the save behind `token` (`?url=` remote loading). */
export function buildMapUrl(token: string, locale: string): string {
    const base = appBaseUrl();
    const saveUrl = `${base}/api/satisfactory-map/${token}/save.sav`;
    const lang = locale === 'de' ? 'de' : 'en';
    return `https://satisfactory-calculator.com/${lang}/interactive-map?url=${encodeURIComponent(saveUrl)}`;
}

/**
 * The URL the owner hands to their players. Without a locale prefix, so each player lands in
 * their own language; the page then redirects to `buildMapUrl`.
 */
export function buildShareUrl(linkId: string): string {
    return `${appBaseUrl()}${SHARE_PAGE_PATH}/${createShareToken(linkId)}`;
}
