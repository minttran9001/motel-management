import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { routing } from "./i18n/navigation";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const locales = routing.locales;

  // Extract locale from pathname (e.g., /en/dashboard -> en)
  const pathname = nextUrl.pathname;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If not on a localized path, let i18n handle the redirect
  if (!pathnameHasLocale && pathname !== "/") {
    return handleI18nRouting(req);
  }

  // Paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/room-status",
    "/rooms",
    "/pricing",
    "/hourly-pricing",
    "/price-calculator",
    "/discounts",
    "/expenses",
    "/history",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    locales.some(
      (locale) =>
        pathname === `/${locale}${path}` ||
        pathname.startsWith(`/${locale}${path}/`)
    )
  );

  const isLoginPage = locales.some((locale) => pathname === `/${locale}/login`);

  if (isProtectedPath && !isLoggedIn) {
    const locale = pathname.split("/")[1] || "en";
    return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
  }

  if (isLoginPage && isLoggedIn) {
    const locale = pathname.split("/")[1] || "en";
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl));
  }

  return handleI18nRouting(req);
});

export const config = {
  // Match only localized paths and the root
  matcher: ["/", "/(en|vi)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
