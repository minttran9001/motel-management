import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "./auth-utils";

type RouteContext =
  | {
      params?: Promise<Record<string, string>>;
    }
  | undefined;

type ApiHandler = (
  request: NextRequest,
  context?: RouteContext
) => Promise<NextResponse>;

/**
 * Wrapper function that automatically checks authentication before executing API route handlers
 * Usage:
 *   export const GET = withAuth(async (request) => { ... });
 *   export const POST = withAuth(async (request, { params }) => { ... });
 */
export function withAuth(handler: ApiHandler) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      const session = await validateAuth();
      console.log({ session });
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Call the original handler with the authenticated request and context
      return await handler(request, context);
    } catch (error) {
      console.error("API route error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for routes that don't require authentication (like public endpoints or seed routes)
 */
export function withoutAuth(handler: ApiHandler) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error("API route error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }
  };
}
