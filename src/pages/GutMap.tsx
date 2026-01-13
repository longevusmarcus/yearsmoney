import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Circle, Droplet, Sparkles, CheckCircle2, AlertTriangle, Plus, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const GutMap = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [consequence, setConsequence] = useState("");
  const [expandedVoice, setExpandedVoice] = useState<number | null>(null);
  const [signalsData, setSignalsData] = useState<any>(null);
  const [trustData, setTrustData] = useState<any>(null);
  const [toneData, setToneData] = useState<any>(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [loadingTrust, setLoadingTrust] = useState(false);
  const [loadingTone, setLoadingTone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedEntries = JSON.parse(localStorage.getItem("gutEntries") || "[]");
    setEntries(storedEntries);
    
    console.log('All entries loaded:', storedEntries);
    console.log('Voice entries:', storedEntries.filter(e => e.mode === "voice" || e.transcript || e.aiInsights));
    
    // Load cached analyses or trigger new ones if any data exists
    if (storedEntries.length >= 1) {
      loadSignalsAnalysis(storedEntries);
      loadTrustAnalysis(storedEntries);
      loadToneAnalysis(storedEntries);
    }
  }, []);

  const loadSignalsAnalysis = async (allEntries: any[]) => {
    // Check cache
    const cached = localStorage.getItem("cachedSignals");
    const cachedTime = localStorage.getItem("cachedSignalsTime");
    const lastEntry = allEntries[allEntries.length - 1]?.timestamp;
    
    if (cached && cachedTime && lastEntry && new Date(cachedTime).getTime() >= new Date(lastEntry).getTime()) {
      setSignalsData(JSON.parse(cached));
      return;
    }
    
    setLoadingSignals(true);
    try {
      const tapEntries = allEntries.filter(e => e.mode === "tap" && e.bodySensation);
      if (tapEntries.length < 1) {
        setSignalsData({ insufficient: true });
        return;
      }

      const summary = tapEntries.map(e => ({
        sensation: e.bodySensation,
        gutFeeling: e.gutFeeling,
        honored: e.willIgnore === "no",
        consequence: e.consequence || null
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
            messages: [{
              role: "user",
              content: `Analyze these body sensations and their reliability:\n\n${JSON.stringify(summary, null, 2)}`
            }],
            type: "signals_analysis"
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSignalsData(data);
        localStorage.setItem("cachedSignals", JSON.stringify(data));
        localStorage.setItem("cachedSignalsTime", new Date().toISOString());
      }
    } catch (error) {
      console.error("Signals analysis error:", error);
    } finally {
      setLoadingSignals(false);
    }
  };

  const loadTrustAnalysis = async (allEntries: any[]) => {
    // Check cache
    const cached = localStorage.getItem("cachedTrust");
    const cachedTime = localStorage.getItem("cachedTrustTime");
    const lastEntry = allEntries[allEntries.length - 1]?.timestamp;
    
    if (cached && cachedTime && lastEntry && new Date(cachedTime).getTime() >= new Date(lastEntry).getTime()) {
      setTrustData(JSON.parse(cached));
      return;
    }
    
    setLoadingTrust(true);
    try {
      const decisionsWithOutcome = allEntries.filter(e => e.willIgnore !== undefined);
      if (decisionsWithOutcome.length < 1) {
        setTrustData({ insufficient: true });
        return;
      }

      const summary = decisionsWithOutcome.map(e => ({
        honored: e.willIgnore === "no",
        consequence: e.consequence || null,
        decision: e.decision || null
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
            messages: [{
              role: "user",
              content: `Analyze trust patterns - when user honors vs ignores gut:\n\n${JSON.stringify(summary, null, 2)}`
            }],
            type: "trust_analysis"
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrustData(data);
        localStorage.setItem("cachedTrust", JSON.stringify(data));
        localStorage.setItem("cachedTrustTime", new Date().toISOString());
      }
    } catch (error) {
      console.error("Trust analysis error:", error);
    } finally {
      setLoadingTrust(false);
    }
  };

  const loadToneAnalysis = async (allEntries: any[]) => {
    // Check cache
    const cached = localStorage.getItem("cachedTone");
    const cachedTime = localStorage.getItem("cachedToneTime");
    const lastEntry = allEntries[allEntries.length - 1]?.timestamp;
    
    // Filter for voice entries - normalize mode and check transcript/insights
    const voiceEntries = allEntries.filter((e) => {
      const mode = (e?.mode ?? '').toString().trim().toLowerCase();
      const hasTranscript = typeof e?.transcript === 'string' && e.transcript.trim().length > 0;
      const hasInsights = typeof e?.aiInsights === 'string' && e.aiInsights.trim().length > 0;
      return mode === 'voice' || hasTranscript || hasInsights;
    });
    
    console.log('Tone analysis - Voice entries found:', voiceEntries.length, voiceEntries);
    
    // Only use cache if we have the same or fewer entries
    if (cached && cachedTime && lastEntry && new Date(cachedTime).getTime() >= new Date(lastEntry).getTime() && voiceEntries.length > 0) {
      const cachedData = JSON.parse(cached);
      console.log('Using cached tone data:', cachedData);
      setToneData(cachedData);
      return;
    }
    
    setLoadingTone(true);
    try {
      if (voiceEntries.length < 1) {
        console.log('Insufficient voice entries for tone analysis');
        setToneData({ insufficient: true });
        return;
      }

      const summary = voiceEntries.map(e => ({
        transcript: e.transcript,
        label: e.label,
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
            messages: [{
              role: "user",
              content: `Analyze voice tone patterns:\n\n${JSON.stringify(summary, null, 2)}`
            }],
            type: "tone_analysis"
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setToneData(data);
        localStorage.setItem("cachedTone", JSON.stringify(data));
        localStorage.setItem("cachedToneTime", new Date().toISOString());
      }
    } catch (error) {
      console.error("Tone analysis error:", error);
    } finally {
      setLoadingTone(false);
    }
  };

  const updateConsequence = async (index: number) => {
    const entry = entries[index];
    const updatedEntries = [...entries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      consequence,
      consequenceDate: new Date().toISOString()
    };
    localStorage.setItem("gutEntries", JSON.stringify(updatedEntries));
    setEntries(updatedEntries);
    setSelectedEntry(null);
    
    // Analyze outcome and adjust XP if needed
    const ignoredGut = entry.willIgnore === "yes";
    const consequenceLower = consequence.toLowerCase();
    
    // Keywords indicating bad outcomes
    const badOutcomeKeywords = [
      'regret', 'wrong', 'mistake', 'bad', 'worse', 'failed', 'should have',
      'wish i', 'disappointed', 'upset', 'stressed', 'anxious', 'uncomfortable',
      'wasn\'t right', 'didn\'t work', 'backfired', 'poor choice', 'went wrong'
    ];
    
    const isBadOutcome = badOutcomeKeywords.some(keyword => 
      consequenceLower.includes(keyword)
    );
    
    let xpChange = 0;
    let feedbackMsg = "Outcome logged";
    
    if (ignoredGut && isBadOutcome) {
      // Deduct 5 XP for ignoring gut and having a bad outcome
      xpChange = -5;
      feedbackMsg = "Lesson learned: -5 XP";
      const { adjustXP } = await import("@/utils/gamification");
      adjustXP(xpChange);
    } else {
      // Just trigger achievement check without XP change
      const { addCheckIn } = await import("@/utils/gamification");
      addCheckIn(0);
    }
    
    setConsequence("");
    
    toast({
      title: feedbackMsg,
      description: xpChange < 0 
        ? "Your gut was trying to protect you" 
        : "Your pattern is learning from this",
    });
  };

  const removeEntry = (index: number) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    localStorage.setItem("gutEntries", JSON.stringify(updatedEntries));
    setEntries(updatedEntries);
    
    // Clear any cached analyses
    localStorage.removeItem("cachedSignals");
    localStorage.removeItem("cachedTrust");
    localStorage.removeItem("cachedTone");
    
    toast({
      title: "Entry removed",
      description: "This check-in has been deleted",
    });
  };

  const removeConsequence = (index: number) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      consequence: null,
      consequenceDate: null
    };
    localStorage.setItem("gutEntries", JSON.stringify(updatedEntries));
    setEntries(updatedEntries);
    toast({
      title: "Outcome removed",
      description: "You can log it again anytime",
    });
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "aligned":
        return "text-success";
      case "misaligned":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getCategoryTag = (entry: any): string => {
    // For tap mode, use the context directly
    if (entry.mode === "tap" && entry.context) {
      return entry.context;
    }
    
    // For voice mode, analyze the transcript to determine category
    if (entry.mode === "voice" && entry.transcript) {
      const text = entry.transcript.toLowerCase();
      
      if (text.includes('money') || text.includes('financial') || text.includes('career') || 
          text.includes('job') || text.includes('business') || text.includes('investment') ||
          text.includes('salary') || text.includes('deal') || text.includes('finance')) {
        return 'Financial';
      }
      
      if (text.includes('relationship') || text.includes('partner') || text.includes('dating') || 
          text.includes('friend') || text.includes('family') || text.includes('love') ||
          text.includes('marriage') || text.includes('breakup')) {
        return 'Relationship';
      }
      
      if (text.includes('health') || text.includes('wellness') || text.includes('medical') ||
          text.includes('doctor') || text.includes('exercise') || text.includes('diet')) {
        return 'Health';
      }
      
      if (text.includes('work') || text.includes('project') || text.includes('meeting') ||
          text.includes('colleague') || text.includes('boss') || text.includes('office')) {
        return 'Work';
      }
      
      if (text.includes('decision') || text.includes('choice') || text.includes('should i')) {
        return 'Decision';
      }
      
      return 'Personal';
    }
    
    return 'General';
  };

  const formatAIInsights = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const elements = [];
    
    // Helper to parse bold text within a string
    const parseBoldText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };
    
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      // Check if it's a bullet point
      const bulletMatch = trimmedLine.match(/^[•·]\s*(.+)$/);
      if (bulletMatch) {
        elements.push(
          <div key={idx} className="flex gap-2 mb-1.5 ml-1">
            <span className="text-primary mt-0.5 flex-shrink-0">•</span>
            <p className="text-sm text-foreground/80 font-light leading-relaxed">
              {parseBoldText(bulletMatch[1])}
            </p>
          </div>
        );
      } 
      // Check if it's a header (title case or ends with specific patterns)
      else if (
        trimmedLine.match(/^(Analysis|What Your Gut Is Saying|Actionable Tips|Today's Guidance|What to Notice|Try This Today)/i)
      ) {
        elements.push(
          <h4 key={idx} className="text-sm font-medium text-foreground mt-3 first:mt-0 mb-1.5">
            {parseBoldText(trimmedLine)}
          </h4>
        );
      } 
      // Regular text
      else {
        elements.push(
          <p key={idx} className="text-sm text-foreground/80 font-light leading-relaxed mb-2">
            {parseBoldText(trimmedLine)}
          </p>
        );
      }
    });
    
    return <div className="space-y-1">{elements}</div>;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-cursive text-foreground tracking-tight">Inner Map</h1>
          <p className="text-base text-muted-foreground font-light">
            Your gut feeling patterns
          </p>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border rounded-[1.25rem]">
            <TabsTrigger value="timeline" className="rounded-[1rem]">Timeline</TabsTrigger>
            <TabsTrigger value="signals" className="rounded-[1rem]">Signals</TabsTrigger>
            <TabsTrigger value="trust" className="rounded-[1rem]">Trust</TabsTrigger>
            <TabsTrigger value="tone" className="rounded-[1rem]">Tone</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4 mt-6">
            {entries.length === 0 ? (
              <Card className="bg-card border-border p-12 rounded-[1.25rem]">
                <div className="text-center space-y-3">
                  <p className="text-lg text-foreground font-light">No entries yet</p>
                  <p className="text-sm text-muted-foreground font-light">
                    Start checking in to see your journey unfold
                  </p>
                </div>
              </Card>
            ) : (
              entries.map((entry, index) => (
                <Card key={index} className="bg-card border-border p-6 rounded-[1.25rem] group relative">
                  {/* Remove Entry Button */}
                  <button
                    onClick={() => removeEntry(index)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg"
                    title="Remove entry"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground font-light">
                        {getCategoryTag(entry)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground font-light">
                        {formatDate(entry.timestamp)}
                      </p>
                      <span className="ml-auto text-xs text-muted-foreground">
                        +{entry.xp} XP
                      </span>
                    </div>
                    <div>
                      {entry.mode === "tap" && (
                        <>
                          <p className="text-base font-medium text-foreground mb-1">
                            {entry.context} • {entry.bodySensation}
                          </p>
                          <p className="text-sm text-muted-foreground font-light">
                            Gut: {entry.gutFeeling} • {entry.willIgnore === "no" ? "Honored it" : "Ignored it"}
                          </p>
                          {entry.decision && (
                            <div className="mt-4">
                              <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50">
                                <div className="flex items-start gap-3">
                                  <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-foreground font-light flex-1">
                                    {entry.decision}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Outcome logging for tap entries */}
                          <div className="mt-4 space-y-3">
                            {selectedEntry === index ? (
                              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <Textarea
                                  value={consequence}
                                  onChange={(e) => setConsequence(e.target.value)}
                                  placeholder="What happened? How did it turn out?"
                                  className="bg-background/80 border-border/50 rounded-2xl min-h-[100px] resize-none text-sm transition-all"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedEntry(null);
                                      setConsequence("");
                                    }}
                                    className="flex-1 py-2 px-4 rounded-xl text-sm font-light text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => updateConsequence(index)}
                                    disabled={!consequence.trim()}
                                    className="flex-1 py-2 px-4 rounded-xl text-sm font-light bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : entry.consequence ? (
                              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in duration-300 group">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="text-xs text-primary/70 font-medium mb-2 uppercase tracking-wide">
                                      Outcome
                                    </p>
                                    <p className="text-sm text-foreground/90 font-light leading-relaxed">
                                      {entry.consequence}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeConsequence(index)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg"
                                    title="Remove outcome"
                                  >
                                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedEntry(index);
                                  setConsequence("");
                                }}
                                className="w-full py-3 px-4 rounded-xl border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-sm text-muted-foreground group-hover:text-primary font-light transition-colors">
                                    Log outcome
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                      {entry.mode === "voice" && (
                        <>
                          <div 
                            onClick={() => setExpandedVoice(expandedVoice === index ? null : index)}
                            className="cursor-pointer group"
                          >
                            <p className="text-base font-medium text-foreground mb-2 flex items-center justify-between">
                              <span>Voice check: {entry.label}</span>
                              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                {expandedVoice === index ? "Show less" : "Show more"}
                              </span>
                            </p>
                            <div className="p-4 bg-secondary/20 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                              <p className={`text-sm text-muted-foreground font-light italic leading-relaxed ${
                                expandedVoice === index ? '' : 'line-clamp-3'
                              }`}>
                                "{entry.transcript}"
                              </p>
                            </div>
                            
                            {entry.aiInsights && (
                              <div className="mt-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-xs text-primary/70 font-medium mb-3 uppercase tracking-wide">
                                  AI Insights
                                </p>
                                <div className={expandedVoice === index ? '' : 'line-clamp-4'}>
                                  {formatAIInsights(entry.aiInsights)}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Outcome logging for voice entries */}
                          <div className="mt-4 space-y-3">
                            {selectedEntry === index ? (
                              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <Textarea
                                  value={consequence}
                                  onChange={(e) => setConsequence(e.target.value)}
                                  placeholder="What happened? How did it turn out?"
                                  className="bg-background/80 border-border/50 rounded-2xl min-h-[100px] resize-none text-sm transition-all"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedEntry(null);
                                      setConsequence("");
                                    }}
                                    className="flex-1 py-2 px-4 rounded-xl text-sm font-light text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => updateConsequence(index)}
                                    disabled={!consequence.trim()}
                                    className="flex-1 py-2 px-4 rounded-xl text-sm font-light bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : entry.consequence ? (
                              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in duration-300 group">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className="text-xs text-primary/70 font-medium mb-2 uppercase tracking-wide">
                                      Outcome
                                    </p>
                                    <p className="text-sm text-foreground/90 font-light leading-relaxed">
                                      {entry.consequence}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeConsequence(index)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg"
                                    title="Remove outcome"
                                  >
                                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedEntry(index);
                                  setConsequence("");
                                }}
                                className="w-full py-3 px-4 rounded-xl border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-sm text-muted-foreground group-hover:text-primary font-light transition-colors">
                                    Log outcome
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>


          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-4 mt-6">
            <Card className="bg-card border-border p-6 rounded-[1.25rem]">
              <h3 className="text-lg font-medium text-foreground mb-4">Your Top Signals</h3>
              {loadingSignals ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : signalsData?.insufficient ? (
                <p className="text-sm text-muted-foreground font-light text-center py-4">
                  Start logging check-ins with body sensations to see your signal patterns
                </p>
              ) : signalsData?.signals ? (
                <div className="space-y-3">
                  {signalsData.signals.map((signal: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Circle className="w-5 h-5 text-primary" strokeWidth={1.5} />
                        <div className="flex-1">
                          <span className="text-base text-foreground font-light">{signal.signal}</span>
                          <p className="text-xs text-muted-foreground font-light mt-0.5">{signal.insight}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{Math.round(signal.accuracy)}% accuracy</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-light text-center py-4">
                  Unable to analyze signals. Try again later.
                </p>
              )}
            </Card>
          </TabsContent>

          {/* Trust Curve Tab */}
          <TabsContent value="trust" className="space-y-4 mt-6">
            <Card className="bg-card border-border p-6 rounded-[1.25rem]">
              <h3 className="text-lg font-medium text-foreground mb-4">Trust Curve</h3>
              {loadingTrust ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : trustData?.insufficient ? (
                <p className="text-sm text-muted-foreground font-light text-center py-4">
                  Start logging decisions and outcomes to see your trust patterns
                </p>
              ) : trustData ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground font-light">Honored gut feelings</span>
                      <span className="text-sm text-foreground font-medium">{Math.round(trustData.honoredPercentage)}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-foreground rounded-full" style={{ width: `${trustData.honoredPercentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground font-light mt-2">{trustData.honoredOutcome}</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground font-light">Ignored gut feelings</span>
                      <span className="text-sm text-foreground font-medium">{Math.round(trustData.ignoredPercentage)}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-muted-foreground rounded-full" style={{ width: `${trustData.ignoredPercentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground font-light mt-2">{trustData.ignoredOutcome}</p>
                  </div>
                  <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-sm text-foreground/90 font-light leading-relaxed">
                      {trustData.recommendation}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-light text-center py-4">
                  Unable to analyze trust patterns. Try again later.
                </p>
              )}
            </Card>
          </TabsContent>

          {/* Tone Tab */}
          <TabsContent value="tone" className="space-y-4 mt-6">
            <Card className="bg-card border-border p-6 rounded-[1.25rem]">
              <h3 className="text-lg font-medium text-foreground mb-4">Tone Patterns</h3>
              {loadingTone ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : toneData?.insufficient || toneData?.insufficientData ? (
                <p className="text-sm text-muted-foreground font-light text-center py-4">
                  Start logging voice check-ins to see your tone patterns
                </p>
              ) : toneData ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-foreground font-medium">When honoring your gut:</p>
                    <p className="text-sm text-muted-foreground font-light">
                      {toneData.honoredTone}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground font-medium">When ignoring your gut:</p>
                    <p className="text-sm text-muted-foreground font-light">
                      {toneData.ignoredTone}
                    </p>
                  </div>
                  {toneData.keyIndicators && toneData.keyIndicators.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground font-medium">Key indicators:</p>
                      <ul className="space-y-1">
                        {toneData.keyIndicators.map((indicator: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground font-light flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toneData.guidance && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-sm text-foreground/90 font-light leading-relaxed">
                        {toneData.guidance}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-light text-center py-4">
                  Unable to analyze tone patterns. Try again later.
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default GutMap;
