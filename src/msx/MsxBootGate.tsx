import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type BootStatus = "idle" | "booting" | "ready" | "failed" | "not-msx";

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

function readLaunchParams(): { token?: string; slug?: string } {
  // 1. URL params (first load from the MSX shell)
  const url = new URL(window.location.href);
  const tokenFromUrl =
    url.searchParams.get("msx_launch_token") ??
    url.searchParams.get("launch_token") ??
    undefined;
  const slugFromUrl =
    url.searchParams.get("msx_app_slug") ??
    url.searchParams.get("app_slug") ??
    undefined;

  if (tokenFromUrl) {
    sessionStorage.setItem(STORAGE_TOKEN, tokenFromUrl);
    if (slugFromUrl) sessionStorage.setItem(STORAGE_SLUG, slugFromUrl);
    // Strip the token from the URL so it doesn't linger.
    url.searchParams.delete("msx_launch_token");
    url.searchParams.delete("launch_token");
    url.searchParams.delete("msx_app_slug");
    url.searchParams.delete("app_slug");
    window.history.replaceState({}, "", url.toString());
    return { token: tokenFromUrl, slug: slugFromUrl ?? "years-time-wealth" };
  }

  // 2. sessionStorage (subsequent SPA navigations within the shell)
  const tokenStored = sessionStorage.getItem(STORAGE_TOKEN) ?? undefined;
  const slugStored = sessionStorage.getItem(STORAGE_SLUG) ?? undefined;
  return { token: tokenStored, slug: slugStored ?? "years-time-wealth" };
}

function looksEmbedded(): boolean {
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const ref = document.referrer || "";
  return /msx\.gg|lsoxtrynzaxohvlqxpqe\.supabase\.co/i.test(ref);
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
      const { token, slug } = readLaunchParams();
      const embedded = looksEmbedded();

      // No launch token AND not embedded → not an MSX context, render normally.
      if (!token && !embedded) {
        setStatus("not-msx");
        return;
      }

      // Embedded but no launch token → explicit launch error, do NOT show login.
      if (!token && embedded) {
        setIsMsx(true);
        setError("Missing MSX launch token");
        setStatus("failed");
        return;
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

        // 2. Convert the magic-link token_hash into a real local session.
        const { error: otpErr } = await supabase.auth.verifyOtp({
          type: "magiclink",
          token_hash: data.tokenHash,
        });
        if (otpErr) throw otpErr;

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
  if (status === "booting" || status === "idle") {
    if (isMsx || looksEmbedded()) {
      return <MsxSplash />;
    }
  }

  if (status === "failed" && isMsx) {
    return <MsxFailure message={error} />;
  }

  return (
    <MsxContext.Provider
      value={{ status, isMsx, entitled, error, msxUserId }}
    >
      <MsxReadyRedirect status={status} isMsx={isMsx} />
      {children}
    </MsxContext.Provider>
  );
};

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
    const path = location.pathname;
    if (path === "/" || path === "/about" || path === "/auth") {
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
