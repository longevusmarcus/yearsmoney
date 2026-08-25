import { supabase } from "@/integrations/supabase/client";

/**
 * Headers for calling edge functions. Sends the signed-in user's access token
 * so protected functions can verify the caller; falls back to the publishable
 * key (which protected functions reject) when there is no session.
 */
export async function functionAuthHeaders(): Promise<Record<string, string>> {
  const publishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  let token = publishable;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) token = data.session.access_token;
  } catch {
    // keep fallback
  }
  return {
    "Content-Type": "application/json",
    apikey: publishable,
    Authorization: `Bearer ${token}`,
  };
}
