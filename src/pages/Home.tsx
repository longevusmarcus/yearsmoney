import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Pause, Sparkles, Shield, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { getGamificationData, calculateLevel, getLevelName } from "@/utils/gamification";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [gamData, setGamData] = useState(getGamificationData());
  const [userName, setUserName] = useState("there");
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [dailyFocus, setDailyFocus] = useState("return to your center — where gut-driven decisions are born");
  const [loadingFocus, setLoadingFocus] = useState(false);

  useEffect(() => {
    const storedEntries = JSON.parse(localStorage.getItem("gutEntries") || "[]");
    setEntries(storedEntries);
    setGamData(getGamificationData());
    
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data }: any = await (supabase.from("profiles") as any)
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();
        
        if (data?.nickname) {
          setUserName(String(data.nickname));
          sessionStorage.setItem("currentUserName", String(data.nickname));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    
    const loadData = async () => {
      await fetchProfile();
      
      // Load AI-powered insights
      await loadInsights(storedEntries);

      // Load or generate missions
      await loadMissions(storedEntries);
      
      // Load daily focus
      await loadDailyFocus(storedEntries);
    };
    
    loadData();
  }, []);

  const levelInfo = calculateLevel(gamData.totalXP);
  const levelName = getLevelName(levelInfo.level);

  const loadDailyFocus = async (allEntries: any[]) => {
    // Check for cached focus from today
    const cachedFocus = localStorage.getItem("cachedDailyFocus");
    const cachedFocusDate = localStorage.getItem("cachedDailyFocusDate");
    const today = new Date().toDateString();

    if (cachedFocus && cachedFocusDate === today) {
      setDailyFocus(cachedFocus);
      return;
    }

    // If less than 3 entries, use default focus
    if (allEntries.length < 3) {
      setDailyFocus("return to your center — where gut-driven decisions are born");
      return;
    }

    // Generate AI-powered focus
    setLoadingFocus(true);
    try {
      const currentUserName = sessionStorage.getItem("currentUserName") || userName || "the user";
      
      const entriesSummary = allEntries.slice(-10).map((e: any) => ({
        timestamp: e.timestamp,
        mode: e.mode,
        label: e.label || e.gutFeeling,
        bodySensation: e.bodySensation,
        honored: e.willIgnore === "no",
        decision: e.decision,
        consequence: e.consequence
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gut-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Generate personalized daily focus for ${currentUserName} based on their check-in data:\n\n${JSON.stringify(entriesSummary, null, 2)}`
              }
            ],
            type: "daily_focus",
            userName: currentUserName
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate focus");

      const data = await response.json();
      
      if (data.focus) {
        setDailyFocus(data.focus);
        
        // Cache focus for today
        localStorage.setItem("cachedDailyFocus", data.focus);
        localStorage.setItem("cachedDailyFocusDate", today);
      }
    } catch (error) {
      console.error("Focus generation error:", error);
      // Keep default focus on error
    } finally {
      setLoadingFocus(false);
    }
  };

  const loadMissions = async (allEntries: any[]) => {
    // Check for cached missions from today
    const cachedMissions = localStorage.getItem("cachedMissions");
    const cachedMissionsDate = localStorage.getItem("cachedMissionsDate");
    const today = new Date().toDateString();

    const iconMap = [Pause, Sparkles, Shield];

    if (cachedMissions && cachedMissionsDate === today) {
      // Use cached missions if they're from today, but re-attach icons
      const parsedMissions = JSON.parse(cachedMissions);
      const missionsWithIcons = parsedMissions.map((m: any, idx: number) => ({
        ...m,
        Icon: iconMap[idx % iconMap.length]
      }));
      setMissions(missionsWithIcons);
      return;
    }

    // If less than 3 entries, use default missions
    if (allEntries.length < 3) {
      const defaultMissions = [
        { id: 1, title: "Pause before saying yes to something", category: "gut trust", Icon: Pause },
        { id: 2, title: "Notice one body signal today", category: "awareness", Icon: Sparkles },
        { id: 3, title: "Honor a no that feels right", category: "boundaries", Icon: Shield },
      ];
      setMissions(defaultMissions);
      return;
    }

    // Generate AI-powered missions
    setLoadingMissions(true);
    try {
      const currentUserName = userName || "the user";
      
      const entriesSummary = allEntries.slice(-10).map((e: any) => ({
        timestamp: e.timestamp,
        mode: e.mode,
        label: e.label || e.gutFeeling,
        bodySensation: e.bodySensation,
        honored: e.willIgnore === "no",
        decision: e.decision,
        consequence: e.consequence
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gut-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Generate 3 personalized missions for ${currentUserName} based on their check-in data:\n\n${JSON.stringify(entriesSummary, null, 2)}`
              }
            ],
            type: "mission_generation",
            userName: currentUserName
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate missions");

      const data = await response.json();
      
      if (data.missions && Array.isArray(data.missions)) {
        const missionsWithIcons = data.missions.map((m: any, idx: number) => ({
          id: idx + 1,
          title: m.title,
          category: m.category,
          Icon: iconMap[idx % iconMap.length]
        }));
        
        setMissions(missionsWithIcons);
        
        // Cache missions for today (without Icon components)
        const missionsForCache = data.missions.map((m: any, idx: number) => ({
          id: idx + 1,
          title: m.title,
          category: m.category
        }));
        localStorage.setItem("cachedMissions", JSON.stringify(missionsForCache));
        localStorage.setItem("cachedMissionsDate", today);
      }
    } catch (error) {
      console.error("Mission generation error:", error);
      // Fall back to default missions
      const defaultMissions = [
        { id: 1, title: "Pause before saying yes to something", category: "gut trust", Icon: Pause },
        { id: 2, title: "Notice one body signal today", category: "awareness", Icon: Sparkles },
        { id: 3, title: "Honor a no that feels right", category: "boundaries", Icon: Shield },
      ];
      setMissions(defaultMissions);
    } finally {
      setLoadingMissions(false);
    }
  };

  const loadInsights = async (allEntries: any[]) => {
    // Check for cached insights from today
    const cachedInsights = localStorage.getItem("cachedInsights");
    const cachedInsightsDate = localStorage.getItem("cachedInsightsDate");
    const today = new Date().toDateString();

    if (cachedInsights && cachedInsightsDate === today) {
      setInsights(JSON.parse(cachedInsights));
      return;
    }

    // If less than 3 entries, use default insights
    if (allEntries.length < 3) {
      const defaultInsights = ["Start checking in to see personalized insights"];
      setInsights(defaultInsights);
      return;
    }

    // Generate AI-powered insights
    setLoadingInsights(true);
    try {
      const currentUserName = sessionStorage.getItem("currentUserName") || userName || "the user";
      
      // Get last 15 entries for more context
      const entriesSummary = allEntries.slice(-15).map((e: any) => ({
        timestamp: e.timestamp,
        mode: e.mode,
        context: e.context,
        label: e.label || e.gutFeeling,
        bodySensation: e.bodySensation,
        honored: e.willIgnore === "no",
        decision: e.decision,
        consequence: e.consequence,
        description: e.description
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gut-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Generate 3 practical, actionable insights for ${currentUserName} based on their check-in data:\n\n${JSON.stringify(entriesSummary, null, 2)}`
              }
            ],
            type: "insights_generation",
            userName: currentUserName
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate insights");

      const data = await response.json();
      
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        
        // Cache insights for today
        localStorage.setItem("cachedInsights", JSON.stringify(data.insights));
        localStorage.setItem("cachedInsightsDate", today);
      }
    } catch (error) {
      console.error("Insights generation error:", error);
      // Fall back to simple insights
      const fallbackInsights = ["Continue checking in to track your patterns"];
      setInsights(fallbackInsights);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-4xl font-cursive text-foreground tracking-tight">Hey, {userName}</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
            <Flame className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium">{gamData.currentStreak}</span>
          </div>
        </div>
      </div>

      {/* Today's Focus Card */}
      <div className="px-6 mb-6">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-light">
          today's focus
        </h2>
        <Card className="bg-card border-border p-3 rounded-[1.25rem]">
          {loadingFocus ? (
            <div className="flex items-center gap-2 text-muted-foreground w-full">
              <Loader2 className="w-3 h-3 animate-spin" />
              <p className="text-xs font-light">Loading your focus...</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Focus text with arrow */}
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-light text-foreground leading-snug">
                  {dailyFocus}
                </p>
                <button 
                  onClick={() => navigate("/map")}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors"
                >
                  <ArrowRight className="w-3 h-3 text-foreground" />
                </button>
              </div>

              {/* Weekly calendar */}
              <div className="flex justify-between items-center gap-0.5 pt-1.5 border-t border-border/50">
                {(() => {
                  const today = new Date();
                  const currentDay = today.getDay();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - currentDay);
                  
                  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                  const weekDays = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + i);
                    
                    // Check if there are any check-ins on this day
                    const hasActivity = entries.some(entry => {
                      const entryDate = new Date(entry.timestamp);
                      return entryDate.toDateString() === date.toDateString();
                    });
                    
                    return { 
                      date, 
                      isToday: date.toDateString() === today.toDateString(),
                      hasActivity 
                    };
                  });

                  return weekDays.map((day, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col items-center gap-0.5 flex-1"
                    >
                      <span className="text-[9px] text-muted-foreground font-light">
                        {days[idx]}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-light transition-colors ${
                        day.isToday 
                          ? 'bg-primary text-primary-foreground' 
                          : day.hasActivity
                          ? 'bg-secondary/50 text-foreground'
                          : 'bg-card text-muted-foreground border border-border/30'
                      }`}>
                        {day.date.getDate()}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Central Voice AI Orb */}
      <div className="px-6 flex flex-col items-center justify-center mb-8">
        {/* Glowing Orb */}
        <div className="relative mb-6">
          {/* Outer glow rings - pulsing */}
          <div className="absolute inset-0 w-64 h-64 -left-4 -top-4 bg-gradient-to-br from-primary/40 via-accent/40 to-secondary/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute inset-0 w-60 h-60 -left-2 -top-2 bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          {/* Main orb */}
          <button
            onClick={() => navigate("/check-in?mode=voice")}
            className="relative w-56 h-56 rounded-full bg-gradient-to-br from-primary/90 via-accent/90 to-secondary/90 flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform hover:scale-105 animate-pulse"
            style={{ animationDuration: '3s' }}
          >
            {/* Inner reflection/highlight */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-16 bg-white/30 rounded-full blur-2xl" />
            
            {/* Subtle particles */}
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/60 rounded-full animate-pulse" />
            <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse delay-75" />
            <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-150" />
          </button>
        </div>

        {/* Tap to speak text */}
        <p className="text-sm text-muted-foreground font-light mb-4">tap to speak</p>

        {/* Level & Days */}
        <div className="text-center space-y-1">
          <p className="text-sm text-foreground font-light">
            level {levelInfo.level} <span className="text-muted-foreground">•</span> {levelName.toLowerCase()}
          </p>
          <p className="text-xs text-muted-foreground font-light">{gamData.currentStreak} days together</p>
        </div>
      </div>

      {/* Today's Missions */}
      <div className="px-6 mb-8">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
          today's missions
        </h2>
        {loadingMissions ? (
          <Card className="bg-card border-border p-8 rounded-[1.25rem] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            <p className="text-sm text-muted-foreground">Generating personalized missions...</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {missions.map((mission) => (
              <Card
                key={mission.id}
                className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4 hover:bg-card/80 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full border-2 border-secondary/20 flex items-center justify-center flex-shrink-0">
                  <mission.Icon className="w-5 h-5 text-secondary" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-light text-foreground">{mission.title}</p>
                  <p className="text-xs font-light text-muted-foreground">{mission.category}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Insights */}
      <div className="px-6">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
          recent insights
        </h2>
        {loadingInsights ? (
          <Card className="bg-card border-border p-8 rounded-[1.25rem] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            <p className="text-sm text-muted-foreground">Generating insights...</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <Card key={idx} className="bg-card border-border p-4 rounded-[1.25rem]">
                <p className="text-sm text-foreground font-light">{insight}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
