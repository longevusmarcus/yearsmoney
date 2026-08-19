import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "./useAuthUser";

interface UserFinances {
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
}

export const useUserFinances = () => {
  const [finances, setFinances] = useState<UserFinances>({
    monthlyIncome: Number(localStorage.getItem("tc_income")) || 0,
    monthlyExpenses: Number(localStorage.getItem("tc_expenses")) || 0,
    netWorth: Number(localStorage.getItem("tc_networth")) || 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user, isLoading: authLoading } = useAuthUser();

  // Load (or migrate) the numbers whenever the shared auth state settles
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("user_finances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data && !error) {
        const dbFinances = {
          monthlyIncome: Number(data.monthly_income),
          monthlyExpenses: Number(data.monthly_expenses),
          netWorth: Number(data.net_worth),
        };
        setFinances(dbFinances);
        localStorage.setItem("tc_income", String(dbFinances.monthlyIncome));
        localStorage.setItem("tc_expenses", String(dbFinances.monthlyExpenses));
        localStorage.setItem("tc_networth", String(dbFinances.netWorth));
      } else {
        // Fresh account: carry over the numbers computed during onboarding.
        const localIncome = Number(localStorage.getItem("tc_income")) || 0;
        const localExpenses = Number(localStorage.getItem("tc_expenses")) || 0;
        const localNetWorth = Number(localStorage.getItem("tc_networth")) || 0;

        if (localIncome > 0 || localExpenses > 0 || localNetWorth > 0) {
          setFinances({ monthlyIncome: localIncome, monthlyExpenses: localExpenses, netWorth: localNetWorth });
          await supabase.from("user_finances").upsert(
            {
              user_id: user.id,
              monthly_income: localIncome,
              monthly_expenses: localExpenses,
              net_worth: localNetWorth,
            },
            { onConflict: "user_id" }
          );
        }
      }
      if (!cancelled) setIsLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);


  const updateFinances = async (newFinances: Partial<UserFinances>) => {
    const updated = { ...finances, ...newFinances };
    setFinances(updated);

    // Always update localStorage
    if (newFinances.monthlyIncome !== undefined) {
      localStorage.setItem("tc_income", String(newFinances.monthlyIncome));
    }
    if (newFinances.monthlyExpenses !== undefined) {
      localStorage.setItem("tc_expenses", String(newFinances.monthlyExpenses));
    }
    if (newFinances.netWorth !== undefined) {
      localStorage.setItem("tc_networth", String(newFinances.netWorth));
    }

    // Sync to database if logged in
    if (user) {
      setIsSyncing(true);
      const { error } = await supabase.from("user_finances").upsert(
        {
          user_id: user.id,
          monthly_income: updated.monthlyIncome,
          monthly_expenses: updated.monthlyExpenses,
          net_worth: updated.netWorth,
        },
        { onConflict: "user_id" }
      );
      
      if (error) {
        console.error("Failed to sync finances:", error);
      }
      setIsSyncing(false);
    }
  };

  return {
    finances,
    updateFinances,
    isLoading,
    isSyncing,
    user,
  };
};
