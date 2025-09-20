import { useSyncExternalStore } from "react";
import { trpc } from "@/lib/trpc";

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
    const data = await trpc.auth.session.query();
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
  await trpc.auth.login.mutate({ userid: payload.userId, password: payload.password });
  await refresh();
}

async function signUp(payload: {
  userId: string;
  password: string;
  email?: string;
}) {
  await trpc.auth["sign-up"].mutate({
    userid: payload.userId,
    password: payload.password,
    email: payload.email,
  });
  await refresh();
}

async function signOut() {
  await trpc.auth.logout.mutate();
  setFromUser(null);
}

async function refresh() {
  try {
    const data = await trpc.auth.session.query();
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
