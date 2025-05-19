import { updateSession, } from "@/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { match } from '@formatjs/intl-localematcher'
import Negotiator from "negotiator";

export async function middleware(request: NextRequest) {

  checkLocal(request);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const user = await supabase.auth.getUser();

  // protected routes
  if (request.nextUrl.pathname.startsWith("/protected") && user.error) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // if (request.nextUrl.pathname === "/" && !user.error) {
  //   return NextResponse.redirect(new URL("/protected", request.url));
  // }

  return response;
}

function checkLocal(request: NextRequest) {
  let headers = { 'accept-language': 'de,en;q=0.5' }
  let languages = new Negotiator({ headers }).languages()
  let locales = ['en', 'de']
  let defaultLocale = 'de'

  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  if (pathnameHasLocale) return

  // Redirect if there is no locale
  const locale = match(languages, locales, defaultLocale)
  request.nextUrl.pathname = `/${locale}${pathname}`
  console.log(request.nextUrl.pathname)
  // e.g. incoming request is /products
  // The new URL is now /en-US/products
  // return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};