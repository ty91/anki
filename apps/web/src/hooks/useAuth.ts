import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthSnapshot = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  accessToken: string | null;
};

let snapshot: AuthSnapshot = {
  status: "loading",
  session: null,
  user: null,
  accessToken: null,
};

const listeners = new Set<() => void>();
let unsubscribeAuth: (() => void) | null = null;
let initialized = false;

function emit() {
  for (const listener of listeners) listener();
}

function setFromSession(session: Session | null) {
  snapshot = {
    status: session ? "authenticated" : "unauthenticated",
    session,
    user: session?.user ?? null,
    accessToken: session?.access_token ?? null,
  };
  emit();
}

async function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setFromSession(null);
  } else {
    setFromSession(data.session);
  }

  const { data: sub } = supabase.auth.onAuthStateChange(
    (_event, newSession) => {
      setFromSession(newSession);
    }
  );
  unsubscribeAuth = () => sub.subscription?.unsubscribe();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void ensureInitialized();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && unsubscribeAuth) {
      unsubscribeAuth();
      unsubscribeAuth = null;
      initialized = false;
      snapshot = {
        status: "loading",
        session: null,
        user: null,
        accessToken: null,
      };
    }
  };
}

function getSnapshot(): AuthSnapshot {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return { status: "loading", session: null, user: null, accessToken: null };
}

export type UseAuthResult = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

async function refresh(): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  setFromSession(data.session);
}

export function useAuth(): UseAuthResult {
  const { status, session, user, accessToken } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    status,
    session,
    user,
    accessToken,
    signInWithGoogle,
    signOut,
    refresh,
  };
}
