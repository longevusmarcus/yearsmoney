import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public landing spot for OAuth redirects. Waits for the session to hydrate,
 * then sends the user into the app (or back to sign-in if it failed).
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const go = (path: string) => {
      if (done) return;
      done = true;
      const intended = sessionStorage.getItem("post_auth_redirect");
      sessionStorage.removeItem("post_auth_redirect");
      navigate(intended && intended.startsWith("/") ? intended : path, { replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go("/home");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go("/home");
      else setTimeout(() => go("/auth"), 3000);
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white/60">
      <p className="text-sm font-light">…</p>
    </div>
  );
}
