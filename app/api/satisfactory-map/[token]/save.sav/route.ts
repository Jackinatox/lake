import { getDownloadUrl } from '@/components/gameserver/FileManager/pteroFileApi';
import { suspensionActiveCutoff } from '@/lib/gameserver/suspension';
import { describeFetchError, logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { listSaves, SATISFACTORY_SAVE_DIR } from '@/lib/satisfactoryMap/saves';
import {
    resolveShareLink,
    takeShareDownload,
    touchShareLink,
} from '@/lib/satisfactoryMap/shareLink';
import { MAP_ORIGINS, verifyMapToken } from '@/lib/satisfactoryMap/token';
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
        'Access-Control-Expose-Headers':
            'Last-Modified, Content-Length, Content-Disposition, Retry-After',
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

type SaveSource = {
    ptServerId: string;
    apiKey: string;
    /** A specific save, or null for the newest one. */
    file: string | null;
    /** Set for share links: rate limited, and their use is recorded. */
    shareLinkId: string | null;
    logContext: { gameServerId: string; userId: string };
};

/** Resolves the token to the server and save it may read, or to the error response instead. */
async function resolveSource(
    req: NextRequest,
    token: string,
): Promise<{ source: SaveSource } | { error: Response }> {
    const verified = verifyMapToken(token);
    if (verified.status === 'expired') {
        return { error: errorResponse(req, 410, 'This map link has expired.') };
    }
    if (verified.status !== 'ok') {
        return { error: errorResponse(req, 404, 'Not found.') };
    }

    if (verified.kind === 'share') {
        const target = await resolveShareLink(verified.linkId);
        if (target.status === 'disabled') {
            return {
                error: errorResponse(req, 410, 'This map link was disabled by the server owner.'),
            };
        }
        if (target.status !== 'ok') {
            return { error: errorResponse(req, 404, 'Not found.') };
        }
        return {
            source: {
                ptServerId: target.ptServerId,
                apiKey: target.ptKey,
                file: null,
                shareLinkId: target.linkId,
                logContext: { gameServerId: target.gameServerId, userId: target.userId },
            },
        };
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
    return {
        source: {
            ptServerId: verified.ptServerId,
            apiKey: server.user.ptKey,
            file: verified.file,
            shareLinkId: null,
            logContext: { gameServerId: server.id, userId: server.userId },
        },
    };
}

/** Resolves the token to its save, or to the error response to send instead. */
async function resolveSave(req: NextRequest, { params }: RouteContext) {
    const { token } = await params;
    const resolved = await resolveSource(req, token);
    if ('error' in resolved) return resolved;
    const { source } = resolved;

    try {
        const saves = await listSaves(source.ptServerId, source.apiKey);
        const { file } = source;
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
        return { save, source };
    } catch (error) {
        logger.warn('Satisfactory map: listing the save folder failed', 'GAME_SERVER', {
            ...source.logContext,
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

function saveHeaders(req: NextRequest, name: string, size: number, lastModified: Date) {
    return {
        ...corsHeaders(req),
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(size),
        'Content-Disposition': contentDisposition(name),
        'Last-Modified': lastModified.toUTCString(),
        'Cache-Control': 'private, no-cache',
    };
}

/** HTTP dates have second precision; compare on that, or every refresh would re-download. */
function isNotModified(req: NextRequest, lastModified: Date) {
    const since = Date.parse(req.headers.get('if-modified-since') ?? '');
    return !Number.isNaN(since) && Math.floor(lastModified.getTime() / 1000) * 1000 <= since;
}

async function handle(req: NextRequest, context: RouteContext, withBody: boolean) {
    const resolved = await resolveSave(req, context);
    if ('error' in resolved) return resolved.error;

    const { save, source } = resolved;
    const { ptServerId, apiKey, logContext, shareLinkId } = source;
    const lastModified = new Date(save.modifiedAt);
    const headers = saveHeaders(req, save.name, save.size, lastModified);

    if (isNotModified(req, lastModified)) {
        const { 'Content-Length': _length, ...notModifiedHeaders } = headers;
        return new Response(null, { status: 304, headers: notModifiedHeaders });
    }
    if (!withBody) return new Response(null, { status: 200, headers });

    // Share links are public for good, so cap full downloads (304s and HEADs are cheap).
    if (shareLinkId) {
        const retryAfter = takeShareDownload(shareLinkId);
        if (retryAfter !== null) {
            const response = errorResponse(
                req,
                429,
                'Too many downloads of this save right now. Try again in a minute.',
            );
            response.headers.set('Retry-After', String(retryAfter));
            return response;
        }
    }

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
                target: shareLinkId ? 'share' : source.file === null ? 'newest' : 'file',
                file: save.name,
                shareLinkId,
                size: save.size,
                origin: req.headers.get('origin'),
            },
        });
        if (shareLinkId) {
            touchShareLink(shareLinkId).catch((error: unknown) =>
                logger.warn('Satisfactory map: recording share link use failed', 'GAME_SERVER', {
                    ...logContext,
                    details: { shareLinkId, error: String(error) },
                }),
            );
        }
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
