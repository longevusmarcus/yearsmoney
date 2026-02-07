import { Home, Search, AlertTriangle, Trophy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Purchase", path: "/purchase" },
    { icon: AlertTriangle, label: "Risks", path: "/risks" },
    { icon: Trophy, label: "Rank", path: "/leaderboard" },
  ];

  return (
    <motion.nav 
      className="fixed bottom-6 left-0 right-0 z-50 px-4 safe-area-bottom"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="max-w-xs mx-auto">
        <div className="flex justify-between items-center px-4 py-3 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg">
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
