import { Suspense, lazy, useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AppBackground } from "./components/AppBackground";
import { I18nProvider } from "./i18n/I18nProvider";
import { MsxBootGate } from "./msx/MsxBootGate";
import Landing from "./pages/Landing";

// Toast layers are never visible on first paint, so they load after the app boots.
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));


// Only the landing page ships in the initial bundle; every other route is fetched
// on demand, which keeps first paint on mobile off the critical path.
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Filosofia = lazy(() => import("./pages/Filosofia"));
const Calcola = lazy(() => import("./pages/Calcola"));
const Home = lazy(() => import("./pages/Home"));
const Purchase = lazy(() => import("./pages/Purchase"));
const Risks = lazy(() => import("./pages/Risks"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Settings = lazy(() => import("./pages/Settings"));
const UBI = lazy(() => import("./pages/UBI"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  // Defer non-visual overlays until after the first paint.
  const [overlays, setOverlays] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOverlays(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
      <TooltipProvider>
        {overlays && (
          <Suspense fallback={null}>
            <Toaster />
            <Sonner />
          </Suspense>
        )}
        <AppBackground />

        <BrowserRouter>
          <ScrollToTop />
          <MsxBootGate>
          <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
          <Routes>
            {/* Landing page — same component on both paths so existing /about links keep working */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/filosofia" element={<Filosofia />} />
            <Route path="/calcola" element={<Calcola />} />

            {/* App screens */}
            <Route path="/home" element={<Home />} />
            <Route path="/purchase" element={<Purchase />} />
            <Route path="/risks" element={<Risks />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Legal/Info pages */}
            <Route path="/ubi" element={<UBI />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </MsxBootGate>
        </BrowserRouter>
      </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
