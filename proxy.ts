import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { isMaintenanceMode, MAINTENANCE_BLOCKED_PATH } from '@/lib/maintenance';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
    if (isMaintenanceMode()) {
        // Also catches server action POSTs, since those are sent to the page's own path.
        const match = request.nextUrl.pathname.match(MAINTENANCE_BLOCKED_PATH);
        if (match) {
            const locale = match[1];
            const url = request.nextUrl.clone();
            url.pathname = locale ? `/${locale}/maintenance` : '/maintenance';
            url.search = '';
            return NextResponse.redirect(url);
        }
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
