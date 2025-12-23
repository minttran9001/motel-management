import axios from "axios";
import { signOut } from "next-auth/react";

// Helper function to get session token from cookies
function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    // Check for both regular and secure cookie names
    if (trimmed.startsWith("authjs.session-token=")) {
      return trimmed.split("=")[1];
    }
    if (trimmed.startsWith("__Secure-authjs.session-token=")) {
      return trimmed.split("=")[1];
    }
  }
  return null;
}

// Flag to prevent multiple simultaneous redirects
let isRedirecting = false;

// Create axios instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Prevent multiple simultaneous redirects
      if (isRedirecting) {
        return Promise.reject(error);
      }

      // Check if this is a token expiration error
      const errorData = error.response?.data || {};
      const errorMessage = errorData.error || "";
      const errorCode = errorData.code || "";
      const isTokenExpired =
        errorCode === "TOKEN_EXPIRED" ||
        errorMessage.includes("expired") ||
        errorMessage.includes("Invalid") ||
        (errorMessage.includes("Unauthorized") && errorCode !== "NO_TOKEN");

      if (isTokenExpired && !originalRequest._retry) {
        isRedirecting = true;
        originalRequest._retry = true;

        try {
          // Clear session using next-auth signOut
          await signOut({ redirect: false });
        } catch (signOutError) {
          console.error("Error signing out:", signOutError);
        }

        // Clear any remaining auth cookies manually as fallback
        if (typeof document !== "undefined") {
          document.cookie =
            "authjs.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie =
            "__Secure-authjs.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }

        // Get locale from current path
        const currentPath = window.location.pathname;
        const locale = currentPath.split("/")[1] || "en";

        // Check if we're already on login page to avoid redirect loop
        if (!currentPath.includes("/login")) {
          // Store a flag in sessionStorage to show expiration message
          sessionStorage.setItem("sessionExpired", "true");

          // Redirect to login page
          window.location.href = `/${locale}/login`;
        }

        // Reset redirect flag after a delay
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }

      return Promise.reject(error);
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

export default api;
