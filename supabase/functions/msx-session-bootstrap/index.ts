// MSX session bootstrap — server-side only.
// Verifies an MSX launch token against the MSX API, then mints a real
// local Supabase session that the SPA can immediately use.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MSX_API_BASE_URL =
  "https://lsoxtrynzaxohvlqxpqe.supabase.co/functions/v1/msx-api";

interface VerifyResponse {
  ok?: boolean;
  valid?: boolean;
  accessMode?: string;
  access_mode?: string;
  msxUserId?: string;
  msx_user_id?: string;
  viewerId?: string;
  viewer_id?: string;
  email?: string;
  slug?: string;
  appSlug?: string;
  [k: string]: unknown;
}

function pickAccessMode(v: VerifyResponse): string | undefined {
  return (v.accessMode ?? v.access_mode) as string | undefined;
}
function pickMsxUserId(v: VerifyResponse): string | undefined {
  return (v.msxUserId ?? v.msx_user_id ?? v.viewerId ?? v.viewer_id) as
    | string
    | undefined;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MSX_TOKEN = Deno.env.get("MSX_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!MSX_TOKEN) {
      return json({ error: "MSX_TOKEN not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const launchToken: string | undefined = body.launchToken ?? body.msx_launch_token;
    const slug: string | undefined = body.slug ?? body.msx_app_slug ?? "years-money";
    if (!launchToken) {
      return json({ error: "Missing launchToken" }, 400);
    }

    // 1. Verify the launch token server-side against MSX
    const verifyRes = await fetch(`${MSX_API_BASE_URL}/v1/launch/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MSX_TOKEN}`,
      },
      body: JSON.stringify({
        launchToken,
        slug,
        credential: MSX_TOKEN,
      }),
    });

    const verifyText = await verifyRes.text();
    let verifyData: VerifyResponse = {};
    try {
      verifyData = verifyText ? JSON.parse(verifyText) : {};
    } catch {
      verifyData = { raw: verifyText } as VerifyResponse;
    }

    if (!verifyRes.ok) {
      return json(
        {
          error: "MSX launch verification failed",
          status: verifyRes.status,
          details: verifyData,
        },
        401,
      );
    }

    const accessMode = pickAccessMode(verifyData);
    if (accessMode !== "full") {
      return json(
        {
          error: "MSX accessMode is not 'full'",
          accessMode,
          details: verifyData,
        },
        403,
      );
    }

    const msxUserId = pickMsxUserId(verifyData);
    if (!msxUserId) {
      return json(
        { error: "MSX did not return a user id", details: verifyData },
        400,
      );
    }

    // 2. Find or create the local Supabase user mapped to this MSX user id.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Synthetic but stable email so the user is unique per MSX identity.
    const syntheticEmail =
      (verifyData.email as string | undefined) ??
      `msx_${msxUserId}@msx.years.money`;

    let userId: string | undefined;

    // Try to find by email first
    const { data: existing } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = existing?.users?.find(
      (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase(),
    );
    if (found) {
      userId = found.id;
    } else {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: syntheticEmail,
          email_confirm: true,
          user_metadata: {
            msx_user_id: msxUserId,
            msx_entitled: true,
            source: "msx",
            nickname: (verifyData.nickname as string | undefined) ?? "MSX User",
          },
        });
      if (createErr || !created?.user) {
        return json(
          { error: "Failed to create local user", details: createErr?.message },
          500,
        );
      }
      userId = created.user.id;
    }

    if (!userId) {
      return json({ error: "No local user id resolved" }, 500);
    }

    // 3. Generate a magiclink we can convert to a session client-side.
    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: syntheticEmail,
      });

    if (linkErr || !linkData) {
      return json(
        { error: "Failed to generate session link", details: linkErr?.message },
        500,
      );
    }

    // The properties contain hashed_token + action_link. We use verifyOtp
    // client-side with token_hash + type=magiclink to materialize a session.
    const tokenHash =
      // @ts-ignore — properties is loosely typed
      linkData.properties?.hashed_token ?? linkData.properties?.token_hash;

    if (!tokenHash) {
      return json(
        { error: "Bootstrap link missing token_hash", details: linkData },
        500,
      );
    }

    return json({
      ok: true,
      tokenHash,
      type: "magiclink",
      email: syntheticEmail,
      msxUserId,
      accessMode,
      entitled: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "Bootstrap exception", message: msg }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
