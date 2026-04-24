// Temporary debug edge function: probes the MSX API with the stored
// MSX_TOKEN so we can see exactly what /v1/launch/verify expects.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const MSX_API = "https://lsoxtrynzaxohvlqxpqe.supabase.co/functions/v1/msx-api";

async function probe(path: string, init: RequestInit) {
  const res = await fetch(`${MSX_API}${path}`, init);
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep text */ }
  return { status: res.status, ok: res.ok, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const MSX_TOKEN = Deno.env.get("MSX_TOKEN") ?? "";
  const url = new URL(req.url);
  const launchToken = url.searchParams.get("launch_token") ?? "test-launch-token";
  const slug = url.searchParams.get("slug") ?? "years-time-wealth";

  const results: Record<string, unknown> = {
    msxTokenLength: MSX_TOKEN.length,
    msxTokenPrefix: MSX_TOKEN.slice(0, 6),
    slug,
    launchToken: launchToken.slice(0, 12) + "...",
  };

  // Test: who am I according to MSX? Try a runtime/probe with our credential.
  results.runtimeProbe = await probe("/v1/runtime/probe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      credential: MSX_TOKEN,
      targetUrl: "https://years.money",
      source: "lovable-debug-probe",
    }),
  });

  // Try every documented variant of /v1/launch/verify with the bearer.
  const variants: Array<{ name: string; body: Record<string, unknown>; bearer: boolean }> = [
    { name: "snake+token-in-body+bearer",  body: { msx_launch_token: launchToken, msx_app_slug: slug, token: MSX_TOKEN }, bearer: true },
    { name: "snake+token-in-body",         body: { msx_launch_token: launchToken, msx_app_slug: slug, token: MSX_TOKEN }, bearer: false },
    { name: "snake+credential",            body: { msx_launch_token: launchToken, msx_app_slug: slug, credential: MSX_TOKEN }, bearer: false },
    { name: "camel+token+bearer",          body: { launchToken, appSlug: slug, token: MSX_TOKEN }, bearer: true },
    { name: "trustnaru-shape",             body: { launchToken, slug, credential: MSX_TOKEN }, bearer: false },
    { name: "verify-token-key",            body: { msx_launch_token: launchToken, msx_app_slug: slug, msx_token: MSX_TOKEN }, bearer: false },
  ];

  const verifyResults: Record<string, unknown> = {};
  for (const v of variants) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (v.bearer) headers["Authorization"] = `Bearer ${MSX_TOKEN}`;
    verifyResults[v.name] = await probe("/v1/launch/verify", {
      method: "POST",
      headers,
      body: JSON.stringify(v.body),
    });
  }
  results.verifyVariants = verifyResults;

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
