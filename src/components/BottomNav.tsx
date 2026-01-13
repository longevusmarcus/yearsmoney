import { Home, Map, Plus, TrendingUp, User, Mic, Edit3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const navItems = [
    { icon: Home, label: "Today", path: "/home" },
    { icon: TrendingUp, label: "Insights", path: "/insights" },
    { icon: Plus, label: "Check In", path: "/check-in", isCheckIn: true },
    { icon: Map, label: "Journey", path: "/map" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const handleCheckInClick = () => {
    setShowCheckInModal(!showCheckInModal);
  };

  const handleCheckInChoice = (mode: 'tap' | 'voice') => {
    setShowCheckInModal(false);
    navigate(`/check-in?mode=${mode}`);
  };

  return (
    <>
      {showCheckInModal && (
        <div 
          className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm"
          onClick={() => setShowCheckInModal(false)}
        />
      )}
      
      <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 safe-area-bottom">
        <div className="max-w-lg mx-auto relative">
          {showCheckInModal && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-3 mb-2">
              <button
                onClick={() => handleCheckInChoice('tap')}
                className="backdrop-blur-xl bg-background/90 border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
              >
                <Edit3 className="w-4 h-4 text-foreground" />
                <span className="text-sm text-foreground">Type</span>
              </button>
              <button
                onClick={() => handleCheckInChoice('voice')}
                className="backdrop-blur-xl bg-background/90 border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
              >
                <Mic className="w-4 h-4 text-foreground" />
                <span className="text-sm text-foreground">Voice</span>
              </button>
            </div>
          )}
          
          <div className="backdrop-blur-2xl bg-background/40 border border-border/30 rounded-full shadow-2xl px-2 py-2">
            <div className="flex justify-between items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => item.isCheckIn ? handleCheckInClick() : navigate(item.path)}
                    className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-full transition-all duration-300 min-w-[60px] ${
                      item.isCheckIn
                        ? "bg-foreground text-background"
                        : isActive 
                          ? "text-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:scale-105"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {!item.isCheckIn && (
                      <span className="text-[8px] font-medium whitespace-nowrap">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
