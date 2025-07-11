import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["de", "en"],
  defaultLocale: "de",
});

export async function middleware(request: NextRequest) {
  console.error("ahhhhh");
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(de|en)/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};