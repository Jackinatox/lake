import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

// Configure supported locales for next-intl
const locales = ['en', 'de'];
const defaultLocale = 'en';

// Initialize the next-intl middleware
const intlMiddleware = createIntlMiddleware({ locales, defaultLocale });

export async function middleware(request: NextRequest) {
  // 1. Apply next-intl localization (sets locale on the request/response)
  const response = intlMiddleware(request);

  // 2. Initialize Supabase server client with cookie handlers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Persist incoming and updated cookies
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  // 3. Refresh session (required for Server Components)
  const { data: { user }, error } = await supabase.auth.getUser();

  // 4. Protect specific routes (example: /protected)
  if (request.nextUrl.pathname.startsWith('/protected') && error) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return response;
}

// Exclude static files, images, and favicon from middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
