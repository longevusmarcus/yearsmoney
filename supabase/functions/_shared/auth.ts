import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Requires a real signed-in user (not just the publishable/anon key).
 * Returns the user id on success, or a ready-to-return 401 Response.
 */
export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string } | { response: Response }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  const deny = () => ({
    response: new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }),
  });

  if (!token) return deny();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return deny();
    return { userId: data.user.id };
  } catch (_e) {
    return deny();
  }
}
