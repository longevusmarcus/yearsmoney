import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type BootStatus = "idle" | "booting" | "ready" | "failed" | "not-msx";

type LaunchPayload = {
  token?: string;
  slug?: string;
  error?: string;
};

interface MsxContextValue {
  status: BootStatus;
  isMsx: boolean;
  entitled: boolean;
  error?: string;
  msxUserId?: string;
}

const MsxContext = createContext<MsxContextValue>({
  status: "idle",
  isMsx: false,
  entitled: false,
});

export const useMsx = () => useContext(MsxContext);

const STORAGE_TOKEN = "msx_launch_token";
const STORAGE_SLUG = "msx_app_slug";
const STORAGE_ENTITLED = "msx_entitled";

const TOKEN_PARAM_KEYS = [
  "msx_launch_token",
  "launch_token",
  "credential",
  "token",
  "msx_token",
] as const;

const SLUG_PARAM_KEYS = ["msx_app_slug", "app_slug", "slug", "appId"] as const;

function readFirst(search: URLSearchParams, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = search.get(key);
    if (value) return value;
  }
  return undefined;
}

function persistLaunch(token?: string, slug?: string) {
  if (token) sessionStorage.setItem(STORAGE_TOKEN, token);
  if (slug) sessionStorage.setItem(STORAGE_SLUG, slug);
}

function scrubUrl(url: URL) {
  for (const key of TOKEN_PARAM_KEYS) url.searchParams.delete(key);
  for (const key of SLUG_PARAM_KEYS) url.searchParams.delete(key);
  if (url.hash.startsWith("#")) {
    const hashParams = new URLSearchParams(url.hash.slice(1));
    let touched = false;
    for (const key of TOKEN_PARAM_KEYS) {
      if (hashParams.has(key)) {
        hashParams.delete(key);
        touched = true;
      }
    }
    for (const key of SLUG_PARAM_KEYS) {
      if (hashParams.has(key)) {
        hashParams.delete(key);
        touched = true;
      }
    }
    if (touched) {
      const nextHash = hashParams.toString();
      url.hash = nextHash ? `#${nextHash}` : "";
    }
  }
}

function readWindowNamePayload(): LaunchPayload {
  if (typeof window.name !== "string" || !window.name.trim()) return {};
  const raw = window.name.trim();
  try {
    const parsed = JSON.parse(raw);
    return extractLaunchPayload(parsed);
  } catch {
    const nameParams = new URLSearchParams(raw.replace(/^msx[:_-]?/i, ""));
    return {
      token: readFirst(nameParams, TOKEN_PARAM_KEYS),
      slug: readFirst(nameParams, SLUG_PARAM_KEYS),
    };
  }
}

function readLaunchFromUrl(value: unknown): LaunchPayload {
  if (typeof value !== "string" || !value) return {};
  try {
    const parsed = new URL(value);
    return {
      token: readFirst(parsed.searchParams, TOKEN_PARAM_KEYS),
      slug: readFirst(parsed.searchParams, SLUG_PARAM_KEYS),
    };
  } catch {
    return {};
  }
}

function extractLaunchPayload(payload: unknown): LaunchPayload {
  if (typeof payload === "string") {
    try {
      return extractLaunchPayload(JSON.parse(payload));
    } catch {
      const params = new URLSearchParams(payload.replace(/^msx[:_-]?/i, ""));
      return {
        token: readFirst(params, TOKEN_PARAM_KEYS),
        slug: readFirst(params, SLUG_PARAM_KEYS),
      };
    }
  }
  if (!payload || typeof payload !== "object") return {};
  const record = payload as Record<string, unknown>;
  const shellPayload =
    record.channel === "msx-shell" && typeof record.payload === "object" && record.payload
      ? (record.payload as Record<string, unknown>)
      : undefined;
  const credential =
    typeof record.credential === "object" && record.credential
      ? (record.credential as Record<string, unknown>)
      : undefined;
  const nested =
    (record.data as Record<string, unknown> | undefined) ??
    (record.payload as Record<string, unknown> | undefined) ??
    (record.msx as Record<string, unknown> | undefined) ??
    (record.launch as Record<string, unknown> | undefined) ??
    (record.session as Record<string, unknown> | undefined) ??
    (record.auth as Record<string, unknown> | undefined) ??
    shellPayload;

  const launchUrlPayload =
    readLaunchFromUrl(record.launchUrl) ||
    readLaunchFromUrl(shellPayload?.launchUrl) ||
    readLaunchFromUrl(shellPayload?.sourceUrl);

  const shellAccess = shellPayload?.access as
    | { allowed?: boolean; reason?: string; mode?: string }
    | undefined;
  const shellError =
    record.channel === "msx-shell" && record.type === "msx:session" && shellAccess?.allowed === false
      ? `MSX access blocked${shellAccess.reason ? `: ${shellAccess.reason}` : ""}`
      : undefined;

  const token =
    [
      record.msx_launch_token,
      record.launch_token,
      record.launchToken,
      record.credential,
      record.token,
      launchUrlPayload.token,
      credential?.msx_launch_token,
      credential?.launch_token,
      credential?.launchToken,
      credential?.token,
      credential?.value,
      nested?.msx_launch_token,
      nested?.launch_token,
      nested?.launchToken,
      nested?.credential,
      nested?.token,
    ].find((value): value is string => typeof value === "string" && value.length > 0) ??
    undefined;

  const slug =
    [
      record.msx_app_slug,
      record.app_slug,
      record.slug,
      record.appId,
      launchUrlPayload.slug,
      nested?.msx_app_slug,
      nested?.app_slug,
      nested?.slug,
      nested?.appId,
    ].find((value): value is string => typeof value === "string" && value.length > 0) ??
    undefined;

  return { token, slug, error: shellError };
}

function readLaunchParams(): { token?: string; slug?: string } {
  const url = new URL(window.location.href);
  const tokenFromUrl = readFirst(url.searchParams, TOKEN_PARAM_KEYS);
  const slugFromUrl = readFirst(url.searchParams, SLUG_PARAM_KEYS);

  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const tokenFromHash = readFirst(hashParams, TOKEN_PARAM_KEYS);
  const slugFromHash = readFirst(hashParams, SLUG_PARAM_KEYS);

  const windowName = readWindowNamePayload();
  const token = tokenFromUrl ?? tokenFromHash ?? windowName.token;
  const slug = slugFromUrl ?? slugFromHash ?? windowName.slug;

  if (token) {
    persistLaunch(token, slug);
    scrubUrl(url);
    window.history.replaceState({}, "", url.toString());
    return { token, slug: slug ?? "years-time-wealth" };
  }

  const tokenStored =
    sessionStorage.getItem(STORAGE_TOKEN) ?? localStorage.getItem(STORAGE_TOKEN) ?? undefined;
  const slugStored =
    sessionStorage.getItem(STORAGE_SLUG) ?? localStorage.getItem(STORAGE_SLUG) ?? undefined;
  return { token: tokenStored, slug: slugStored ?? "years-time-wealth" };
}

function looksLikeMsxShell(): boolean {
  // Only treat the app as launched-by-MSX when we have a strong MSX signal.
  // Being inside *any* iframe (e.g. the Lovable editor preview) is NOT enough,
  // otherwise the editor preview gets stuck on the MSX splash/error screen.
  const ref = document.referrer || "";
  if (/msx\.gg|lsoxtrynzaxohvlqxpqe\.supabase\.co/i.test(ref)) return true;

  const url = new URL(window.location.href);
  if (
    url.searchParams.has("msx") ||
    url.searchParams.has("msx_shell") ||
    url.searchParams.get("source") === "msx"
  ) {
    return true;
  }

  // UA / window-name hints some shells set
  if (/MSX/i.test(navigator.userAgent)) return true;
  if (typeof window.name === "string" && /^msx[:_-]/i.test(window.name)) {
    return true;
  }

  return false;
}

function waitForMsxLaunchPayload(timeoutMs = 1500): Promise<LaunchPayload> {
  return new Promise((resolve) => {
    const immediate = readWindowNamePayload();
    if (immediate.token) {
      persistLaunch(immediate.token, immediate.slug);
      resolve({ token: immediate.token, slug: immediate.slug });
      return;
    }

    const requestBridge = () => {
      const requests = [
        { type: "msx:getLaunchContext", source: "years-app" },
        { type: "msx:requestLaunchContext", source: "years-app" },
        { type: "msx:getLaunchToken", source: "years-app" },
        { type: "msx:requestCredential", source: "years-app" },
        { type: "MSX_GET_LAUNCH_CONTEXT", source: "years-app" },
        { type: "MSX_REQUEST_LAUNCH_TOKEN", source: "years-app" },
        { type: "MSX_REQUEST_CREDENTIAL", source: "years-app" },
      ];

      for (const message of requests) {
        try {
          window.parent?.postMessage(message, "*");
        } catch {
          // Ignore cross-origin postMessage failures.
        }
      }
    };

    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("msx-launch-context", onCustomEvent as EventListener);
      resolve({});
    }, timeoutMs);

    const onMessage = (event: MessageEvent) => {
      const incoming = extractLaunchPayload(event.data);
      if (incoming.error) {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        window.removeEventListener("msx-launch-context", onCustomEvent as EventListener);
        resolve(incoming);
        return;
      }
      if (!incoming.token) return;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      persistLaunch(incoming.token, incoming.slug);
      resolve(incoming);
    };

    const onCustomEvent = (event: Event) => {
      const custom = event as CustomEvent;
      const incoming = extractLaunchPayload(custom.detail);
      if (incoming.error) {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        window.removeEventListener("msx-launch-context", onCustomEvent as EventListener);
        resolve(incoming);
        return;
      }
      if (!incoming.token) return;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("msx-launch-context", onCustomEvent as EventListener);
      persistLaunch(incoming.token, incoming.slug);
      resolve(incoming);
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("msx-launch-context", onCustomEvent as EventListener);
    requestBridge();
    window.setTimeout(requestBridge, 250);
  });
}

export const MsxBootGate = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<BootStatus>("idle");
  const [error, setError] = useState<string | undefined>();
  const [entitled, setEntitled] = useState(false);
  const [msxUserId, setMsxUserId] = useState<string | undefined>();
  const [isMsx, setIsMsx] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let { token, slug } = readLaunchParams();
      const msxShell = looksLikeMsxShell();

      // No launch token AND not in an MSX shell → not an MSX context, render normally.
      if (!token && !msxShell) {
        setStatus("not-msx");
        return;
      }

      // In an MSX shell but no launch token yet → wait briefly for the shell auth bridge.
      if (!token && msxShell) {
        setIsMsx(true);
        setStatus("booting");
        const awaited = await waitForMsxLaunchPayload();
        token = awaited.token;
        slug = awaited.slug ?? slug;
        if (awaited.error) {
          setError(awaited.error);
          setStatus("failed");
          return;
        }
        if (!token) {
          setError("Missing MSX launch token from MSX launch session");
          setStatus("failed");
          return;
        }
      }

      setIsMsx(true);
      setStatus("booting");

      try {
        // Fast-path: if we already booted in this session, just confirm
        // the local Supabase session still exists.
        const cachedEntitled = sessionStorage.getItem(STORAGE_ENTITLED) === "1";
        if (cachedEntitled) {
          const { data: s } = await supabase.auth.getSession();
          if (s.session) {
            if (cancelled) return;
            setEntitled(true);
            setStatus("ready");
            return;
          }
        }

        // 1. Server-side bootstrap (verifies token + mints a session link)
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const bootstrapUrl = `https://${projectId}.supabase.co/functions/v1/msx-session-bootstrap`;
        const res = await fetch(bootstrapUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            launchToken: token,
            slug: slug ?? "years-time-wealth",
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `Bootstrap failed (${res.status})`);
        }
        if (!data.access_token || !data.refresh_token) {
          throw new Error("Bootstrap response missing session tokens");
        }

        // 2. Install the real local session.
        const { error: setErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (setErr) throw setErr;

        // 3. Confirm the session is live before unlocking the app.
        const { data: sessionData, error: sessErr } =
          await supabase.auth.getSession();
        if (sessErr) throw sessErr;
        if (!sessionData?.session) {
          throw new Error("Local session not established after bootstrap");
        }

        if (cancelled) return;
        sessionStorage.setItem(STORAGE_ENTITLED, "1");
        setMsxUserId(data.msxUserId);
        setEntitled(true);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown MSX boot error");
        setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // While MSX is booting, render only the splash. Never render auth/landing.
  // Only show the splash when we already know this is an MSX launch — otherwise
  // we'd block the normal app (including the Lovable editor preview).
  if ((status === "booting" || status === "idle") && isMsx) {
    return <MsxSplash />;
  }

  if (status === "failed" && isMsx) {
    return <MsxFailure message={error} />;
  }

  // MSX ready but we haven't yet jumped to /home → still show splash to
  // prevent a flash of the public landing/auth UI.
  if (
    isMsx &&
    status === "ready" &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/home" &&
    !window.location.pathname.startsWith("/home")
  ) {
    // The redirect below will fire on next tick; cover the gap with the splash.
  }

  return (
    <MsxContext.Provider
      value={{ status, isMsx, entitled, error, msxUserId }}
    >
      <MsxReadyRedirect status={status} isMsx={isMsx} />
      {isMsx && status === "ready" && !isAtAuthedRoute() ? <MsxSplash /> : children}
    </MsxContext.Provider>
  );
};

function isAtAuthedRoute(): boolean {
  if (typeof window === "undefined") return true;
  const p = window.location.pathname;
  // Anything under the real app shell counts as authed.
  return (
    p === "/home" ||
    p.startsWith("/home") ||
    p.startsWith("/purchase") ||
    p.startsWith("/risks") ||
    p.startsWith("/leaderboard") ||
    p.startsWith("/settings") ||
    p.startsWith("/ubi") ||
    p.startsWith("/terms") ||
    p.startsWith("/privacy")
  );
}

const MsxReadyRedirect = ({
  status,
  isMsx,
}: {
  status: BootStatus;
  isMsx: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!isMsx || status !== "ready") return;
    if (!isAtAuthedRoute()) {
      navigate("/home", { replace: true });
    }
  }, [status, isMsx, location.pathname, navigate]);
  return null;
};

const MsxSplash = () => (
  <div
    style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      gap: "1rem",
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.15)",
        borderTopColor: "#8B5CF6",
        animation: "msx-spin 0.9s linear infinite",
      }}
    />
    <div style={{ fontSize: 14, opacity: 0.85, letterSpacing: "0.02em" }}>
      Opening in MSX…
    </div>
    <style>{`@keyframes msx-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const MsxFailure = ({ message }: { message?: string }) => (
  <div
    style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      textAlign: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      gap: "0.75rem",
    }}
  >
    <div style={{ fontSize: 18, fontWeight: 500 }}>MSX launch failed</div>
    <div style={{ fontSize: 13, opacity: 0.7, maxWidth: 360 }}>
      {message ?? "We couldn't verify your MSX session."}
    </div>
    <div style={{ fontSize: 12, opacity: 0.5, marginTop: "0.5rem" }}>
      Please relaunch Years from the MSX shell.
    </div>
  </div>
);
