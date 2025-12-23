import type { NextAuthConfig } from "next-auth";

const SESSION_MAX_MINUTES = 15;
const SESSION_MAX_AGE = SESSION_MAX_MINUTES * 60; // 1 minute in seconds
const SESSION_UPDATE_AGE = 0; // Disable rolling sessions - expiration time will never be updated

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE, // Disable rolling sessions - expiration time will never be updated
  },
  callbacks: {
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);

      // When user first logs in, set the initial issued at time and expiration
      if (user) {
        token.role = (user as { role?: string }).role;
        token.iat = now; // Set issued at time
        const originalExp = now + SESSION_MAX_AGE;
        token.exp = originalExp; // Set expiration time
        // Store original expiration in a custom field to prevent NextAuth from updating it
        (token as Record<string, unknown>).originalExp = originalExp;
        return token;
      }

      // Use original expiration time if available, otherwise fall back to exp
      const originalExp = (token as Record<string, unknown>).originalExp as
        | number
        | undefined;
      const expirationTime = originalExp || (token.exp as number) || 0;

      // If token has expired, throw error to force logout
      if (now >= expirationTime) {
        // Token is expired - throw error to prevent any updates
        throw new Error("Session expired");
      }

      // CRITICAL: Always restore the original expiration time
      // This prevents NextAuth from updating/extending the expiration
      if (originalExp) {
        token.exp = originalExp;
        (token as Record<string, unknown>).originalExp = originalExp; // Keep the original
      } else if (token.exp && typeof token.exp === "number") {
        // If no originalExp but exp exists, use it as the original
        (token as Record<string, unknown>).originalExp = token.exp;
      } else {
        // Safety check: if neither exists, set both (shouldn't happen)
        const newExp = now + SESSION_MAX_AGE;
        token.exp = newExp;
        (token as Record<string, unknown>).originalExp = newExp;
      }

      return token;
    },
    async session({ session, token }) {
      const now = Math.floor(Date.now() / 1000);

      // If token is null or expired, return expired session
      if (!token) {
        return { ...session, expires: new Date(0).toISOString() };
      }

      const expirationTime = (token.exp as number) || 0;

      // If session has expired, return expired session
      if (now >= expirationTime) {
        return { ...session, expires: new Date(0).toISOString() };
      }

      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }

      // Set the session expiration based on token expiration
      (session as { expires: string }).expires = new Date(
        expirationTime * 1000
      ).toISOString();
      return session;
    },
  },
  providers: [], // Add providers with empty array for now, will be populated in auth.ts
} satisfies NextAuthConfig;
