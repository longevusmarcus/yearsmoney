import { useEffect, useRef } from "react";
import { Home, Search, AlertTriangle, Trophy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nProvider";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const warmed = useRef(false);

  // Preload the Risks screen and wake its pricing backend while the user is
  // still on another page, so the first visit is not stuck on a cold start.
  useEffect(() => {
    if (warmed.current || location.pathname === "/risks") return;
    warmed.current = true;
    const run = async () => {
      void import("@/pages/Risks");
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investment-prices`, {
          method: "POST",
          headers: await functionAuthHeaders(),
          body: JSON.stringify({ warmup: true }),
        });
      } catch {
        /* warmup is best-effort */
      }
    };

    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    if (idle) idle(run);
    else setTimeout(run, 1200);
  }, [location.pathname]);

  const navItems = [
    { icon: Home, label: t("app.nav.home"), path: "/home" },
    { icon: Search, label: t("app.nav.purchase"), path: "/purchase" },
    { icon: AlertTriangle, label: t("app.nav.risks"), path: "/risks" },
    { icon: Trophy, label: t("app.nav.rank"), path: "/leaderboard" },
  ];

  return (
    <motion.nav 
      className="fixed bottom-6 left-0 right-0 z-50 px-4 safe-area-bottom"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="max-w-xs mx-auto">
        <div className="flex justify-between items-center px-4 py-3 bg-black/85 backdrop-blur-xl border border-border/60 rounded-full shadow-[0_18px_60px_-24px_rgba(0,0,0,0.6)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center p-2.5 transition-all duration-300"
              >
                <Icon 
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground/60 hover:text-foreground"
                  }`} 
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {isActive && (
                  <motion.div 
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-foreground"
                    layoutId="nav-indicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNav;
