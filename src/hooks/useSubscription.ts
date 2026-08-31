import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { useAuthUser } from "@/hooks/useAuthUser";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

/**
 * Premium access state for the signed-in user. Combines recurring
 * subscriptions and one-time (lifetime) purchases. Client-side only — used
 * for UX gating, never as a security boundary.
 */
export function useSubscription() {
  const { user, isLoading: authLoading } = useAuthUser();
  const [isPremium, setIsPremium] = useState(
    () => localStorage.getItem("years_premium") === "true",
  );
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !isPaymentsConfigured()) {
      setIsLoading(false);
      return;
    }
    const environment = getStripeEnvironment();

    const [{ data: subs }, { data: purchases }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .eq("environment", environment)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("purchases")
        .select("status")
        .eq("user_id", user.id)
        .eq("environment", environment)
        .eq("status", "paid")
        .limit(1),
    ]);

    const sub = subs?.[0];
    const endsInFuture = !sub?.current_period_end
      || new Date(sub.current_period_end).getTime() > Date.now();
    const hasSub = Boolean(
      sub && endsInFuture
        && (ACTIVE_STATUSES.includes(sub.status) || sub.status === "canceled"),
    );
    const hasLifetime = Boolean(purchases?.length);
    const premium = hasSub || hasLifetime;

    setIsPremium(premium);
    if (premium) localStorage.setItem("years_premium", "true");
    else localStorage.removeItem("years_premium");
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return { isPremium, isLoading, refresh };
}
