import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
    return intlMiddleware(request);
}

export const config = {
    matcher: [
        '/',
        '/(de|en)/:path*',
        '/((?!api|sitemap.xml|robots.txt|_next/static|_next/image|favicon.ico|webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
