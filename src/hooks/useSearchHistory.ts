import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SearchHistoryItem {
  id: string;
  search_query: string;
  search_type: string;
  result_data: any;
  created_at: string;
}

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Load history
  const loadHistory = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setHistory(data as SearchHistoryItem[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadHistory(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadHistory(session.user.id);
      } else {
        setHistory([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadHistory]);

  const addSearchToHistory = async (
    searchQuery: string,
    searchType: string = "purchase",
    resultData?: any
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("search_history")
      .insert({
        user_id: user.id,
        search_query: searchQuery,
        search_type: searchType,
        result_data: resultData,
      })
      .select()
      .single();

    if (!error && data) {
      setHistory((prev) => [data as SearchHistoryItem, ...prev].slice(0, 50));
      return data;
    }
    return null;
  };

  const deleteFromHistory = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", user.id);

    if (!error) {
      setHistory([]);
    }
  };

  return {
    history,
    isLoading,
    addSearchToHistory,
    deleteFromHistory,
    clearHistory,
    isLoggedIn: !!user,
  };
};
