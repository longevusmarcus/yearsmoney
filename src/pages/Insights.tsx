import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { TrendingUp, Compass, Heart, Loader2, Waves, Moon, Wind, Leaf, Plus, Circle, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { getGamificationData } from "@/utils/gamification";
import { supabase } from "@/integrations/supabase/client";
import { PatternCard } from "@/components/PatternCard";

const Insights = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [showDailyGuidance, setShowDailyGuidance] = useState(false);
  const [hasSeenToday, setHasSeenToday] = useState(false);
  const [dailyGuidance, setDailyGuidance] = useState("");
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [patterns, setPatterns] = useState("");
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [trustScore, setTrustScore] = useState(0);
  const [weekStats, setWeekStats] = useState({ checkins: 0, honored: 0, decisions: 0 });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedEntries = JSON.parse(localStorage.getItem("gutEntries") || "[]");
    setEntries(storedEntries);
    
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
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
    
    const lastSeen = localStorage.getItem("lastDailyGuidance");
    const today = new Date().toDateString();
    setHasSeenToday(lastSeen === today);

    // Calculate trust score
    const totalWithDecisions = storedEntries.filter((e: any) => e.willIgnore !== undefined).length;
    const honored = storedEntries.filter((e: any) => e.willIgnore === "no").length;
    const score = totalWithDecisions > 0 ? Math.round((honored / totalWithDecisions) * 100) : 0;
    setTrustScore(score);

    // Calculate this week's stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekEntries = storedEntries.filter((e: any) => new Date(e.timestamp) >= oneWeekAgo);
    setWeekStats({
      checkins: thisWeekEntries.length,
      honored: thisWeekEntries.filter((e: any) => e.willIgnore === "no").length,
      decisions: thisWeekEntries.filter((e: any) => e.decision && e.decision.trim().length > 0).length
    });

    // Load patterns if we have enough data
    if (storedEntries.length >= 3) {
      // Check if we have cached patterns
      const cachedPatterns = localStorage.getItem("cachedPatterns");
      const cachedPatternsTimestamp = localStorage.getItem("cachedPatternsTimestamp");
      const lastEntryTimestamp = storedEntries[storedEntries.length - 1]?.timestamp;
      
      // Use cached patterns if they exist and are still valid (no new entries since last analysis)
      if (cachedPatterns && cachedPatternsTimestamp && lastEntryTimestamp) {
        const cachedTime = new Date(cachedPatternsTimestamp).getTime();
        const lastEntryTime = new Date(lastEntryTimestamp).getTime();
        
        if (cachedTime >= lastEntryTime) {
          // Use cached patterns
          setPatterns(cachedPatterns);
          return;
        }
      }
      
      // Generate new patterns if no valid cache
      loadPatternAnalysis(storedEntries);
    }
  }, []);

  // Store userName in a way that can be accessed by functions
  useEffect(() => {
    if (userName) {
      sessionStorage.setItem("currentUserName", userName);
    }
  }, [userName]);

  const loadPatternAnalysis = async (allEntries: any[]) => {
    setLoadingPatterns(true);
    
    try {
      const currentUserName = sessionStorage.getItem("currentUserName") || userName || "the user";
      
      const entriesSummary = allEntries.slice(-10).map((e: any) => ({
        timestamp: e.timestamp,
        mode: e.mode,
        label: e.label || e.gutFeeling,
        transcript: e.transcript || e.description,
        bodySensation: e.bodySensation,
        honored: e.willIgnore === "no",
        aiInsights: e.aiInsights
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
                content: `Analyze ${currentUserName}'s entries and return 2-3 patterns. Return ONLY the JSON array, nothing else:\n\n${JSON.stringify(entriesSummary, null, 2)}`
              }
            ],
            type: "pattern_analysis",
            userName: currentUserName
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to load patterns");

      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        const patternsStr = JSON.stringify(json);
        setPatterns(patternsStr);
        
        // Cache the patterns
        localStorage.setItem("cachedPatterns", patternsStr);
        localStorage.setItem("cachedPatternsTimestamp", new Date().toISOString());
        
        setLoadingPatterns(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let patternText = "";

      if (reader) {
        // Accumulate the complete response
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  patternText += content;
                }
              } catch (e) {
                // Skip invalid chunks during streaming
              }
            }
          }
        }

        // Now validate the complete response
        if (patternText.trim()) {
          const cleaned = patternText.trim()
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '');
          
          // Test if we have valid JSON
          try {
            const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              JSON.parse(jsonMatch[0]); // Validate it's parseable
              setPatterns(patternText);
            } else {
              console.error("No valid JSON array found");
              setPatterns("ERROR: Could not parse patterns");
            }
          } catch (e) {
            console.error("JSON validation failed:", e);
            setPatterns("ERROR: Could not parse patterns");
          }
        } else {
          setPatterns("ERROR: No response received");
        }
      }
    } catch (error) {
      console.error("Pattern analysis error:", error);
      setPatterns("ERROR: Failed to load patterns");
    } finally {
      setLoadingPatterns(false);
    }
  };

  const handleStartGuidance = async () => {
    setShowDailyGuidance(true);
    setLoadingGuidance(true);
    localStorage.setItem("lastDailyGuidance", new Date().toDateString());
    setHasSeenToday(true);

    try {
      const currentUserName = sessionStorage.getItem("currentUserName") || userName || "you";
      
      const recentEntries = entries.slice(-7).map((e: any) => ({
        timestamp: e.timestamp,
        mode: e.mode,
        label: e.label || e.gutFeeling,
        transcript: e.transcript || e.description,
        honored: e.willIgnore === "no",
        aiInsights: e.aiInsights
      }));

      const hasData = entries.length > 0;
      const userMessage = hasData 
        ? `Provide personalized guidance based on ${currentUserName}'s recent check-ins:\n\n${JSON.stringify(recentEntries, null, 2)}`
        : `${currentUserName} is just beginning their intuition journey. Provide welcoming guidance to help them start connecting with their gut feelings.`;

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
                content: userMessage
              }
            ],
            type: "daily_guidance",
            userName: currentUserName
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to load guidance");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let guidanceText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  guidanceText += content;
                  setDailyGuidance(guidanceText);
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Guidance error:", error);
      setDailyGuidance("Unable to load guidance right now. Try again later.");
    } finally {
      setLoadingGuidance(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-cursive text-foreground tracking-tight">Insights</h1>
          <p className="text-base text-muted-foreground font-light">
            Your intuition patterns over time
          </p>
        </div>

        {/* Daily Guidance */}
        <Card className={`${hasSeenToday && !showDailyGuidance ? 'bg-card/50' : 'bg-card'} border-border p-6 rounded-[1.25rem]`}>
          {!showDailyGuidance ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-border/50 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-light text-foreground">Daily Guidance</p>
              </div>
              <p className="text-base font-light text-muted-foreground">
                {hasSeenToday 
                  ? "Come back tomorrow for new personalized guidance"
                  : "Get AI-powered insights based on your recent check-ins"
                }
              </p>
              {!hasSeenToday && (
                <button
                  onClick={handleStartGuidance}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[1rem] text-sm font-light transition-colors hover:scale-[1.02]"
                >
                  Get Today's Guidance
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {loadingGuidance && !dailyGuidance && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm">Analyzing your patterns...</p>
                </div>
              )}
              {dailyGuidance && (
                <div className="space-y-4 prose prose-sm max-w-none">
                  {dailyGuidance.split('\n').map((line, idx) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <h3 key={idx} className="text-lg font-medium text-foreground mt-4 first:mt-0">
                          {line.replace(/\*\*/g, '')}
                        </h3>
                      );
                    } else if (line.trim()) {
                      return (
                        <p key={idx} className="text-base text-foreground/80 font-light leading-relaxed">
                          {line}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Trust Score */}
        <Card className="bg-card border-border p-6 rounded-[1.25rem]">
          {entries.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-border/50 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-base text-muted-foreground font-light">
                Start checking in to build your trust score
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-border/50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-light">Trust Score</p>
                  <p className="text-2xl font-light text-foreground">{trustScore}%</p>
                </div>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" 
                  style={{ width: `${trustScore}%` }} 
                />
              </div>
              <p className="text-sm text-muted-foreground font-light">
                {trustScore >= 70 
                  ? "You're honoring your gut feelings consistently. Keep it up!" 
                  : trustScore >= 40 
                  ? "You're building trust with your intuition. Stay curious."
                  : trustScore > 0
                  ? "Every time you honor your gut, you build more trust."
                  : "Start tracking decisions to see your trust score grow."}
              </p>
            </div>
          )}
        </Card>

        {/* Patterns */}
        <div className="space-y-4">
          <h2 className="text-lg font-light text-foreground">Your Patterns</h2>
          
          {entries.length < 3 ? (
            <Card className="bg-card border-border p-6 rounded-[1.25rem]">
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center mx-auto">
                  <Plus className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-base text-muted-foreground font-light">
                  Check in at least 3 times to discover your patterns
                </p>
                <p className="text-sm text-muted-foreground/70 font-light">
                  {entries.length > 0 
                    ? `${entries.length} of 3 check-ins completed` 
                    : "Start your journey to unlock personalized insights"}
                </p>
              </div>
            </Card>
          ) : (
            <>
              {loadingPatterns && !patterns && (
                <Card className="bg-card border-border p-8 rounded-[1.25rem]">
                  <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-light">Discovering your intuition patterns...</p>
                  </div>
                </Card>
              )}
            
            {patterns && patterns !== "ERROR: Could not parse patterns" && patterns !== "ERROR: Failed to load patterns" && (() => {
              try {
                let cleanedPatterns = patterns.trim();
                
                // Remove markdown artifacts
                cleanedPatterns = cleanedPatterns
                  .replace(/```json\s*/gi, '')
                  .replace(/```\s*/g, '')
                  .replace(/^[^[{]*/,'')
                  .replace(/[^}\]]*$/,'');
                
                // Find JSON array
                const jsonMatch = cleanedPatterns.match(/\[\s*\{[\s\S]*\}\s*\]/);
                
                if (jsonMatch) {
                  let jsonStr = jsonMatch[0];
                  
                  // Fix common issues
                  jsonStr = jsonStr
                    .replace(/,(\s*[}\]])/g, '$1')
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ');
                  
                  const patternData = JSON.parse(jsonStr);
                  
                  if (Array.isArray(patternData) && patternData.length > 0) {
                    const icons = [Compass, Waves, Moon, Wind, Leaf, Heart];
                    const colors = ["primary", "accent", "primary", "accent", "primary", "accent"];
                    
                    return (
                      <div className="space-y-3 animate-fade-in">
                        {patternData.map((pattern: any, idx: number) => {
                          const Icon = icons[idx % icons.length];
                          const color = colors[idx % colors.length];
                          
                          return (
                            <PatternCard
                              key={idx}
                              title={pattern.title || "Pattern Discovered"}
                              observation={pattern.observation || ""}
                              intuitionGuide={pattern.intuitionGuide || ""}
                              relatedEntries={Array.isArray(pattern.relatedEntries) ? pattern.relatedEntries : []}
                              questions={Array.isArray(pattern.questions) ? pattern.questions : []}
                              icon={<Icon className={`w-5 h-5 ${color === "accent" ? "text-accent" : "text-primary"}`} strokeWidth={1} />}
                              accentColor={color}
                            />
                          );
                        })}
                      </div>
                    );
                  }
                }
              } catch (e) {
                console.error("Failed to parse patterns:", e);
                console.log("Raw patterns:", patterns.substring(0, 500));
              }
              
              // Still processing
              return null;
            })()}
            
            {(loadingPatterns || (patterns && !patterns.startsWith("ERROR") && patterns.indexOf('[{') === -1)) && (
              <Card className="bg-card border-border p-8 rounded-2xl">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Analyzing your patterns...</p>
                </div>
              </Card>
            )}
            
            {patterns && patterns.startsWith("ERROR") && (
              <Card className="bg-card border-border p-6 rounded-2xl">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Unable to analyze patterns right now. Please try again later.
                  </p>
                  <button
                    onClick={() => {
                      setPatterns("");
                      localStorage.removeItem("cachedPatterns");
                      localStorage.removeItem("cachedPatternsTimestamp");
                      loadPatternAnalysis(entries);
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                  >
                    Retry Analysis
                  </button>
                </div>
              </Card>
            )}
            
            {!loadingPatterns && !patterns && (
              <Card className="bg-card border-border p-8 rounded-2xl">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-light">
                    Keep checking in to discover your patterns
                  </p>
                </div>
              </Card>
            )}
          </>
          )}
        </div>

        {/* Weekly Summary */}
        <div className="space-y-3">
          <h2 className="text-lg font-light text-foreground">This Week</h2>
          
          <Card className="bg-card border-border p-6 rounded-[1.25rem]">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-border/50 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-base font-light text-foreground">Check-ins</p>
                  <p className="text-xl font-light text-foreground">{weekStats.checkins}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-border/50 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-base font-light text-foreground">Gut honored</p>
                  <p className="text-xl font-light text-foreground">{weekStats.honored}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-border/50 flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-base font-light text-foreground">Positive outcomes</p>
                  <p className="text-xl font-light text-foreground">{weekStats.decisions}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Insights;
