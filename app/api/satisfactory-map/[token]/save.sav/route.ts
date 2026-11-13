import { getDownloadUrl } from '@/components/gameserver/FileManager/pteroFileApi';
import { suspensionActiveCutoff } from '@/lib/gameserver/suspension';
import { describeFetchError, logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { listSaves, SATISFACTORY_SAVE_DIR } from '@/lib/satisfactoryMap/saves';
import { MAP_ORIGINS, verifyMapToken } from '@/lib/satisfactoryMap/token';
import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public, CORS-enabled download of a Satisfactory server's save, for the hosted interactive
 * map's `?url=` remote loading. The token names either a specific save or "the newest one".
 * The signed token in the path is the only authorization: the map fetches cross-site, so no
 * session cookie arrives here.
 * Pterodactyl's own download links can't be handed out (single-use, CORS only for the panel),
 * so the file is streamed through. See docs/satisfactory-interactive-map.md.
 */

type RouteContext = { params: Promise<{ token: string }> };

function corsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get('origin');
    return {
        'Access-Control-Allow-Origin':
            origin && MAP_ORIGINS.includes(origin) ? origin : MAP_ORIGINS[0],
        'Access-Control-Expose-Headers': 'ETag, Last-Modified, Content-Length, Content-Disposition',
        Vary: 'Origin',
        'X-Robots-Tag': 'noindex',
    };
}

function errorResponse(req: NextRequest, status: number, message: string) {
    return new Response(message, {
        status,
        headers: {
            ...corsHeaders(req),
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

/** Resolves the token to its save, or to the error response to send instead. */
async function resolveSave(req: NextRequest, { params }: RouteContext) {
    const { token } = await params;
    const verified = verifyMapToken(token);
    if (verified.status === 'expired') {
        return { error: errorResponse(req, 410, 'This map link has expired.') };
    }
    if (verified.status !== 'ok') {
        return { error: errorResponse(req, 404, 'Not found.') };
    }

    const server = await prisma.gameServer.findFirst({
        where: {
            ptServerId: verified.ptServerId,
            status: 'ACTIVE',
            gameData: { slug: 'satisfactory' },
            suspensions: {
                none: { liftedAt: null, expiresAt: { gt: suspensionActiveCutoff() } },
            },
        },
        select: { id: true, userId: true, user: { select: { ptKey: true } } },
    });
    if (!server?.user.ptKey) {
        return { error: errorResponse(req, 404, 'Not found.') };
    }

    const logContext = { gameServerId: server.id, userId: server.userId };
    try {
        const saves = await listSaves(verified.ptServerId, server.user.ptKey);
        const { file } = verified;
        // A specific save must still be in the listing, which also keeps the name inside the folder.
        const save = file === null ? saves[0] : saves.find((entry) => entry.name === file);
        if (!save) {
            return {
                error: errorResponse(
                    req,
                    404,
                    file === null ? 'This server has no save yet.' : 'This save no longer exists.',
                ),
            };
        }
        return {
            save,
            file,
            ptServerId: verified.ptServerId,
            apiKey: server.user.ptKey,
            logContext,
        };
    } catch (error) {
        logger.warn('Satisfactory map: listing the save folder failed', 'GAME_SERVER', {
            ...logContext,
            details: describeFetchError(error),
        });
        return { error: errorResponse(req, 502, 'The server could not be reached.') };
    }
}

/**
 * Header values must be Latin-1, but save names are free text. The game even writes "ö" as
 * U+FFC3 U+FFB6. So send an ASCII fallback plus the RFC 5987 `filename*` with the real name.
 */
function contentDisposition(name: string) {
    const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/**
 * Identifies one version of one save. Name, mtime and size all go in, so the tag also changes
 * when the "newest save" switches to an older file, which an `If-Modified-Since` check misses.
 */
function saveETag(name: string, modifiedAt: string, size: number) {
    const hash = createHash('sha256').update(`${name}\0${modifiedAt}\0${size}`).digest('base64url');
    return `"${hash.slice(0, 22)}"`;
}

function saveHeaders(
    req: NextRequest,
    name: string,
    size: number,
    lastModified: Date,
    etag: string,
) {
    return {
        ...corsHeaders(req),
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(size),
        'Content-Disposition': contentDisposition(name),
        ETag: etag,
        'Last-Modified': lastModified.toUTCString(),
        'Cache-Control': 'private, no-cache',
    };
}

/**
 * `If-None-Match` wins over `If-Modified-Since` (RFC 9110 13.2.2). The date check only matches
 * the exact mtime, not "not newer": when the newest save is deleted, the next one is older than
 * the cached copy and must still be sent. HTTP dates have second precision, so compare on that.
 */
function isNotModified(req: NextRequest, etag: string, lastModified: Date) {
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch !== null) {
        return ifNoneMatch
            .split(',')
            .map((tag) => tag.trim().replace(/^W\//, ''))
            .some((tag) => tag === '*' || tag === etag);
    }
    const since = Date.parse(req.headers.get('if-modified-since') ?? '');
    return !Number.isNaN(since) && Math.floor(lastModified.getTime() / 1000) * 1000 === since;
}

async function handle(req: NextRequest, context: RouteContext, withBody: boolean) {
    const resolved = await resolveSave(req, context);
    if ('error' in resolved) return resolved.error;

    const { save, ptServerId, apiKey, logContext } = resolved;
    const lastModified = new Date(save.modifiedAt);
    const etag = saveETag(save.name, save.modifiedAt, save.size);
    const headers = saveHeaders(req, save.name, save.size, lastModified, etag);

    if (isNotModified(req, etag, lastModified)) {
        const { 'Content-Length': _length, ...notModifiedHeaders } = headers;
        return new Response(null, { status: 304, headers: notModifiedHeaders });
    }
    if (!withBody) return new Response(null, { status: 200, headers });

    try {
        // A fresh single-use Wings link per request, fetched server-side and streamed through.
        const url = await getDownloadUrl(
            ptServerId,
            `${SATISFACTORY_SAVE_DIR}/${save.name}`,
            apiKey,
        );
        const upstream = await fetch(url, { cache: 'no-store' });
        if (!upstream.ok || !upstream.body) {
            throw new Error(`Wings download answered ${upstream.status}`);
        }
        // The map actually fetched the save: compare with "link opened" lines to see how many
        // clicks end in a loaded map. Not awaited so the download isn't held up.
        void logger.info('Satisfactory map: save served', 'GAME_SERVER', {
            ...logContext,
            details: {
                target: resolved.file === null ? 'newest' : 'file',
                file: save.name,
                size: save.size,
                origin: req.headers.get('origin'),
            },
        });
        const length = upstream.headers.get('content-length');
        return new Response(upstream.body, {
            status: 200,
            headers: length ? { ...headers, 'Content-Length': length } : headers,
        });
    } catch (error) {
        logger.warn('Satisfactory map: downloading the save failed', 'GAME_SERVER', {
            ...logContext,
            details: { file: save.name, ...describeFetchError(error) },
        });
        return errorResponse(req, 502, 'The save could not be downloaded.');
    }
}

export function GET(req: NextRequest, context: RouteContext) {
    return handle(req, context, true);
}

export function HEAD(req: NextRequest, context: RouteContext) {
    return handle(req, context, false);
}

/** The map sends a preflight (it adds a request header), so allow whatever it asks for. */
export function OPTIONS(req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            ...corsHeaders(req),
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers':
                req.headers.get('access-control-request-headers') ?? '*',
            'Access-Control-Max-Age': '86400',
        },
    });
}
