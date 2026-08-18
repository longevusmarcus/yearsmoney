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
    publish(session?.user ?? null);
  });

  initPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      publish(null);
      return;
    }
    // Re-validate with the auth server: a locally stored but expired/revoked
    // session would otherwise look valid while every table read fails.
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      publish(refreshed.session?.user ?? null);
      return;
    }
    publish(userData.user);
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
