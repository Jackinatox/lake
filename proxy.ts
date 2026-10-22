import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { DOCS_URL } from './lib/metadata';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
    // In production the reverse proxy serves the Starlight docs under /docs/ before lake sees the
    // request. Anywhere else (dev), send it to them instead of locale-prefixing it to /de/docs/.
    const { pathname, search } = request.nextUrl;
    if (pathname === '/docs' || pathname.startsWith('/docs/')) {
        return NextResponse.redirect(
            `${DOCS_URL}${pathname.slice('/docs'.length) || '/'}${search}`,
        );
    }
    return intlMiddleware(request);
}

export const config = {
    matcher: [
        '/',
        '/(de|en)/:path*',
        '/((?!api|sitemap.xml|robots.txt|_next/static|_next/image|favicon.ico|webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
