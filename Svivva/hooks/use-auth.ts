"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

const SESSION_TOKEN_KEY = "vivva_session_token";

// Immediately capture any ?session_token= from URL at module load time,
// so the token is in localStorage before any React query fires.
if (typeof window !== "undefined") {
  const _p = new URLSearchParams(window.location.search);
  const _t = _p.get("session_token");
  if (_t) {
    localStorage.setItem(SESSION_TOKEN_KEY, _t);
    _p.delete("session_token");
    const _newUrl = _p.toString()
      ? `${window.location.pathname}?${_p.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", _newUrl);
    // Also bridge into cookie (fire-and-forget)
    fetch("/api/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token: _t }),
    }).catch(() => {});
  }
}

// Get session token from localStorage
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

// Set session token in localStorage
export function setSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

// Clear session token from localStorage
export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

// Check URL for session token, store it, and bridge it into a server-side cookie
function captureSessionToken(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("session_token");
  if (token) {
    setSessionToken(token);
    // Remove token from URL
    params.delete("session_token");
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
    // Bridge: ask the server to set a proper same-domain cookie so all
    // subsequent API calls work regardless of localStorage state
    fetch("/api/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    }).catch(() => {
      /* non-critical */
    });
  }
}

// If we have a localStorage token but no server cookie, silently re-bridge
async function ensureSessionCookie(): Promise<void> {
  const token = getSessionToken();
  if (!token) return;
  // Fire-and-forget: bridge the token into a same-domain cookie
  fetch("/api/auth/set-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  }).catch(() => {
    /* non-critical */
  });
}

async function fetchUser(): Promise<AuthUser | null> {
  // Capture token from URL if present
  captureSessionToken();
  // Bridge existing localStorage token into a server-side cookie (silent)
  await ensureSessionCookie();

  const headers: HeadersInit = {};
  const token = getSessionToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/auth/user", {
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  clearSessionToken();
  window.location.href = "/api/auth/logout";
}

// Helper function to make authenticated fetch calls
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const token = getSessionToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

/** Parse JSON from authFetch without Safari's cryptic response.json() failures on empty/HTML bodies. */
export async function parseAuthJsonResponse<T = Record<string, unknown>>(
  response: Response,
): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return {} as T;
  }

  let text = "";
  try {
    text = await response.text();
  } catch {
    throw new Error(
      response.status === 403
        ? "Admin unlock required — enter the admin passcode on this page first."
        : `Could not read server response (HTTP ${response.status}).`,
    );
  }

  if (!text.trim()) {
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Admin unlock required — enter the admin passcode on this page first.");
      }
      throw new Error(`Request failed (HTTP ${response.status})`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const html = text.trimStart().startsWith("<");
    throw new Error(
      !response.ok
        ? html
          ? `Server error (HTTP ${response.status}). Sign in and unlock admin, then try again.`
          : `Request failed (HTTP ${response.status}).`
        : "Server returned an unexpected response. Refresh the page and try again.",
    );
  }
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function redirectToLogin(returnTo?: string) {
  const dest =
    returnTo || (typeof window !== "undefined" ? window.location.pathname : "/dashboard");
  window.location.href = `/api/auth/login?redirect=${encodeURIComponent(dest)}`;
}
