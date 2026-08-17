import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AppBackground } from "./components/AppBackground";
import { I18nProvider } from "./i18n/I18nProvider";
import { MsxBootGate } from "./msx/MsxBootGate";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Filosofia from "./pages/Filosofia";
import Calcola from "./pages/Calcola";
import Home from "./pages/Home";
import Purchase from "./pages/Purchase";
import Risks from "./pages/Risks";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import UBI from "./pages/UBI";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppBackground />
        <BrowserRouter>
          <ScrollToTop />
          <MsxBootGate>
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
            
            {/* Legal/Info pages */}
            <Route path="/ubi" element={<UBI />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </MsxBootGate>
        </BrowserRouter>
      </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
