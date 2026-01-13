import { Home, Search, AlertTriangle, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Purchase", path: "/purchase" },
    { icon: AlertTriangle, label: "Risks", path: "/risks" },
    { icon: Sparkles, label: "Ideas", path: "/opportunities" },
  ];

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="backdrop-blur-2xl bg-background/80 border border-border/30 rounded-full shadow-2xl px-2 py-2">
          <div className="flex justify-between items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-full transition-all duration-300 ${
                    isActive 
                      ? "bg-foreground text-background" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
