import { useSyncExternalStore } from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthUser = {
  id: number;
  userId: string;
};

type AuthSnapshot = {
  status: AuthStatus;
  user: AuthUser | null;
};

let snapshot: AuthSnapshot = {
  status: "loading",
  user: null,
};

const listeners = new Set<() => void>();
let initialized = false;

function emit() {
  for (const listener of listeners) listener();
}

function setFromUser(user: AuthUser | null) {
  snapshot = {
    status: user ? "authenticated" : "unauthenticated",
    user,
  };
  emit();
}

async function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch session");
    const data = (await response.json()) as { user: AuthUser | null };
    setFromUser(data.user);
  } catch {
    setFromUser(null);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void ensureInitialized();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      initialized = false;
      snapshot = { status: "loading", user: null };
    }
  };
}

function getSnapshot(): AuthSnapshot {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return { status: "loading", user: null };
}

export type UseAuthResult = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (payload: { userId: string; password: string }) => Promise<void>;
  signUp: (payload: {
    userId: string;
    password: string;
    email?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

async function signIn(payload: { userId: string; password: string }) {
  const response = await fetch(`/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userid: payload.userId, password: payload.password }),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to sign in.");
  }
  await refresh();
}

async function signUp(payload: {
  userId: string;
  password: string;
  email?: string;
}) {
  const response = await fetch(`/api/auth/sign-up`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userid: payload.userId,
      password: payload.password,
      email: payload.email,
    }),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to sign up.");
  }
  await refresh();
}

async function signOut() {
  const response = await fetch(`/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to sign out.");
  }
  setFromUser(null);
}

async function refresh() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch session");
    const data = (await response.json()) as { user: AuthUser | null };
    setFromUser(data.user);
  } catch (error) {
    setFromUser(null);
    if (error instanceof Error) throw error;
    throw new Error("Failed to refresh session");
  }
}

export function useAuth(): UseAuthResult {
  const { status, user } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    status,
    user,
    signIn,
    signUp,
    signOut,
    refresh,
  };
}
