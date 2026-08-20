import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for the signed-in user.
 *
 * Every page used to run its own getSession() on mount, which meant a page that
 * mounted before the session finished hydrating (MSX launch, OAuth callback,
 * token refresh) rendered as "signed out" and never recovered. This hook keeps
 * one shared, validated user in module state and notifies all subscribers.
 */
let cachedUser: User | null = null;
let ready = false;
let initPromise: Promise<void> | null = null;
const subscribers = new Set<(u: User | null) => void>();

const publish = (user: User | null) => {
  cachedUser = user;
  ready = true;
  subscribers.forEach((fn) => fn(user));
};

const init = () => {
  if (initPromise) return initPromise;

  supabase.auth.onAuthStateChange((_event, session) => {
    // Never downgrade a known-good user to null on a transient event while a
    // refresh is still in flight — only explicit sign-out clears the user.
    if (!session?.user && _event !== "SIGNED_OUT" && cachedUser) return;
    publish(session?.user ?? null);
  });

  initPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    const storedUser = data.session?.user ?? null;
    if (!data.session) {
      publish(null);
      return;
    }

    // Optimistically trust the stored session so pages render as signed in
    // while we re-validate against the auth server.
    publish(storedUser);

    const { data: userData, error } = await supabase.auth.getUser();
    if (!error && userData.user) {
      publish(userData.user);
      return;
    }

    // Access token expired (typical after >24h away). Retry the refresh a few
    // times: a single failure is often a race with the client's own auto
    // refresh or a flaky network, not a revoked session.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshed.session?.user) {
        publish(refreshed.session.user);
        return;
      }
      const message = refreshError?.message?.toLowerCase() ?? "";
      // Definitively dead session — stop retrying and sign out cleanly.
      if (message.includes("refresh token not found") || message.includes("invalid refresh token")) {
        await supabase.auth.signOut().catch(() => {});
        publish(null);
        return;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }

    // Could not validate (offline?). Keep the stored user rather than showing
    // a half-signed-in app; a later auth event will correct it.
    publish(storedUser);
  })();

  return initPromise;
};


export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!ready);

  useEffect(() => {
    const listener = (u: User | null) => {
      setUser(u);
      setIsLoading(false);
    };
    subscribers.add(listener);
    if (ready) listener(cachedUser);
    void init();
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  return { user, isLoading };
};
