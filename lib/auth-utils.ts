import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Validates authentication for API routes
 * Returns the session if authenticated, or null if not
 */
export async function validateAuth() {
  try {
    const session = await auth();
    if (!session?.user) {
      return null;
    }
    return session;
  } catch (error) {
    console.error("Auth validation error:", error);
    return null;
  }
}

/**
 * Gets the session token from the request
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback to cookies (next-auth stores session in cookies)
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith("authjs.session-token=")) {
        return cookie.split("=")[1];
      }
      if (cookie.startsWith("__Secure-authjs.session-token=")) {
        return cookie.split("=")[1];
      }
    }
  }

  return null;
}

/**
 * Middleware helper to check authentication in API routes
 * Returns NextResponse with error if not authenticated, or null if authenticated
 */
export async function requireAuth(request?: NextRequest) {
  // First try to validate using auth() function (this checks cookies automatically)
  const session = await validateAuth();
  if (session) {
    return { session, error: null };
  }

  // If that fails and we have a request, check if token was provided
  if (request) {
    const token = getTokenFromRequest(request);
    if (token) {
      // Token exists in request, but session validation failed
      // This means the token is invalid or expired
      return {
        session: null,
        error: NextResponse.json(
          {
            success: false,
            error: "Unauthorized - Invalid or expired token",
            code: "TOKEN_EXPIRED",
          },
          { status: 401 }
        ),
      };
    }
  }

  // No valid session and no token provided
  return {
    session: null,
    error: NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        code: "NO_TOKEN",
      },
      { status: 401 }
    ),
  };
}
