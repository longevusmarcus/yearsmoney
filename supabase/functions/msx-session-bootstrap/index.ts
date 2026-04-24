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

async function verifyLaunchToken(args: {
  launchToken: string;
  slug: string;
  msxToken: string;
}): Promise<{ res: Response; data: VerifyResponse; payload: Record<string, string> }> {
  const { launchToken, slug, msxToken } = args;

  const payloads: Record<string, string>[] = [
    {
      msx_launch_token: launchToken,
      msx_app_slug: slug,
      token: msxToken,
    },
    {
      launch_token: launchToken,
      app_slug: slug,
      token: msxToken,
    },
    {
      launchToken,
      appSlug: slug,
      token: msxToken,
    },
    {
      launchToken,
      slug,
      token: msxToken,
    },
    {
      msx_launch_token: launchToken,
      msx_app_slug: slug,
      credential: msxToken,
    },
    {
      launch_token: launchToken,
      app_slug: slug,
      credential: msxToken,
    },
  ];

  let lastRes: Response | undefined;
  let lastData: VerifyResponse = {};
  let lastPayload = payloads[payloads.length - 1];

  for (const payload of payloads) {
    const res = await fetch(`${MSX_API_BASE_URL}/v1/launch/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${msxToken}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: VerifyResponse = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text } as VerifyResponse;
    }

    console.log("msx verify attempt", {
      status: res.status,
      payloadKeys: Object.keys(payload),
      ok: res.ok,
      valid: data.valid,
      accessMode: pickAccessMode(data),
    });

    lastRes = res;
    lastData = data;
    lastPayload = payload;

    if (res.ok) {
      return { res, data, payload };
    }

    const errorText = typeof data.error === "string" ? data.error : "";
    if (!/invalid launch verify payload/i.test(errorText)) {
      return { res, data, payload };
    }
  }

  return {
    res: lastRes!,
    data: lastData,
    payload: lastPayload,
  };
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
    const slug: string | undefined = body.slug ?? body.msx_app_slug ?? "years-time-wealth";
    if (!launchToken) {
      return json({ error: "Missing launchToken" }, 400);
    }

    // 1. Verify the launch token server-side against MSX
    const { res: verifyRes, data: verifyData, payload: verifyPayload } =
      await verifyLaunchToken({
        launchToken,
        slug,
        msxToken: MSX_TOKEN,
      });

    if (!verifyRes.ok) {
      return json(
        {
          error: "MSX launch verification failed",
          status: verifyRes.status,
          attemptedPayloadKeys: Object.keys(verifyPayload),
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

    // 3. Generate a one-time link, then immediately exchange it server-side
    //    so we can hand the SPA real access + refresh tokens. This avoids
    //    the deprecated `magiclink` verifyOtp type and removes any client-side
    //    token verification round-trip.
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

    // @ts-ignore — properties is loosely typed
    const tokenHash: string | undefined =
      // @ts-ignore
      linkData.properties?.hashed_token ?? linkData.properties?.token_hash;

    if (!tokenHash) {
      return json(
        { error: "Bootstrap link missing token_hash", details: linkData },
        500,
      );
    }

    // Use an anon client to exchange the token_hash → real session.
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: otp, error: otpErr } = await anon.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    if (otpErr || !otp?.session) {
      return json(
        {
          error: "Failed to materialize session from token_hash",
          details: otpErr?.message,
        },
        500,
      );
    }

    return json({
      ok: true,
      access_token: otp.session.access_token,
      refresh_token: otp.session.refresh_token,
      expires_at: otp.session.expires_at,
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
