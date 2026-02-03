import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import About from "./pages/About";
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Navigate to="/about" replace />} />
            <Route path="/about" element={<About />} />
            
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
