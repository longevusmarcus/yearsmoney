import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mic, Zap, Waves, Sun, Circle, Droplet, Sparkles, Cloud, CheckCircle, XCircle, Pause, Plus, Activity } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import VoiceBubbleLogo from "@/components/VoiceBubbleLogo";

type TapStep = "context" | "describe" | "body" | "gut" | "ignore" | "gentle-reminder" | "congratulations" | "decision";
type VoiceStep = "recording" | "processing" | "label" | "response" | "analyzing" | "insights" | "gut" | "ignore" | "gentle-reminder" | "congratulations";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const CheckIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "tap";

  // Tap Flow State
  const [tapStep, setTapStep] = useState<TapStep>("context");
  const [context, setContext] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [description, setDescription] = useState("");
  const [bodySensation, setBodySensation] = useState("");
  const [customSensation, setCustomSensation] = useState("");
  const [gutFeeling, setGutFeeling] = useState("");
  const [willIgnore, setWillIgnore] = useState("");
  const [decision, setDecision] = useState("");

  // Voice Flow State
  const [voiceStep, setVoiceStep] = useState<VoiceStep>("recording");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [wantsResponse, setWantsResponse] = useState<boolean | null>(null);
  const [aiInsights, setAiInsights] = useState("");
  const [userName, setUserName] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, first_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserName(profile.nickname || profile.first_name || 'Friend');
        }
      }
    };
    
    fetchUserName();
    
    if (mode === "voice") {
      startVoiceRecording();
    }
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [mode]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setVoiceStep("processing");
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (!base64Audio) {
            toast({
              title: "Error",
              description: "Failed to process audio.",
              variant: "destructive",
            });
            navigate("/home");
            return;
          }

          try {
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audioData: base64Audio }
            });

            if (error) throw error;

            const transcriptText = data.transcript?.trim() || "";
            
            if (!transcriptText) {
              toast({
                title: "No Speech Detected",
                description: "Please try again and speak clearly.",
                variant: "destructive",
              });
              navigate("/home");
              return;
            }

            setTranscript(transcriptText);
            setVoiceStep("label");

          } catch (error) {
            console.error("Transcription error:", error);
            toast({
              title: "Error",
              description: "Failed to transcribe audio. Please try again.",
              variant: "destructive",
            });
            navigate("/home");
          }
        };
      };

      setIsRecording(true);
      mediaRecorder.start();

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 60000);

    } catch (error) {
      console.error("Error starting voice recording:", error);
      toast({
        title: "Error",
        description: "Failed to start voice recording. Please check microphone permissions.",
        variant: "destructive",
      });
      navigate("/home");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTapComplete = async () => {
    const entry = {
      mode: "tap",
      context,
      customNote,
      description,
      bodySensation: bodySensation || customSensation,
      gutFeeling,
      willIgnore,
      decision: decision || null,
      timestamp: new Date().toISOString(),
      xp: willIgnore === "no" ? 10 : 5,
      needsFollowUp: decision.trim().length > 0
    };
    
    // Save to localStorage
    const entries = JSON.parse(localStorage.getItem("gutEntries") || "[]");
    entries.push(entry);
    localStorage.setItem("gutEntries", JSON.stringify(entries));
    
    // Update gamification
    const { addCheckIn } = await import("@/utils/gamification");
    const gamData = addCheckIn(entry.xp);
    
    toast({
      title: `+${entry.xp} XP`,
      description: willIgnore === "no" ? "Great choice honoring your gut!" : "You checked in.",
    });
    navigate("/map");
  };

  const analyzeVoiceWithAI = async () => {
    setVoiceStep("analyzing");
    
    try {
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
                content: `Please analyze this voice recording transcript and provide insights about my gut feeling:\n\n"${transcript}"\n\nLabel: ${selectedLabel}\nWants to track response: ${wantsResponse ? "Yes" : "No"}`
              }
            ],
            type: "voice_analysis"
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to analyze");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let analysis = "";

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
                  analysis += content;
                  setAiInsights(analysis);
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }

      setVoiceStep("insights");
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Continuing without AI insights.",
        variant: "destructive",
      });
      handleVoiceComplete();
    }
  };

  const handleVoiceComplete = async () => {
    const xpAmount = willIgnore === "no" ? 10 : 5;
    const entry = {
      mode: "voice",
      transcript,
      label: selectedLabel,
      gutFeeling,
      willIgnore,
      bodySensation: bodySensation || "",
      wantsResponse,
      aiInsights,
      timestamp: new Date().toISOString(),
      xp: xpAmount
    };
    
    // Save to localStorage
    const entries = JSON.parse(localStorage.getItem("gutEntries") || "[]");
    entries.push(entry);
    localStorage.setItem("gutEntries", JSON.stringify(entries));
    
    // Update gamification
    const { addCheckIn } = await import("@/utils/gamification");
    const gamData = addCheckIn(entry.xp);
    
    toast({
      title: `+${xpAmount} XP`,
      description: willIgnore === "no" ? "Great choice honoring your gut!" : "You checked in.",
    });
    navigate("/map");
  };

  // Voice Flow Render
  if (mode === "voice") {
    if (voiceStep === "recording" || voiceStep === "processing") {
      return (
        <div className="min-h-screen bg-background flex flex-col p-6">
          <button onClick={() => navigate("/home")} className="self-start mb-8">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>

          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
            <p className="text-xl text-muted-foreground font-light">
              Speak freely — what's your body saying?
            </p>

            <button 
              onClick={isRecording ? stopVoiceRecording : undefined}
              className="relative flex items-center justify-center focus:outline-none"
              disabled={!isRecording}
            >
              {/* Outer ambient glow */}
              <div 
                className={`absolute w-80 h-80 rounded-full blur-[80px] transition-all duration-1000 pointer-events-none ${
                  isRecording 
                    ? 'bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 opacity-100' 
                    : 'bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 opacity-60'
                }`}
                style={{
                  animation: isRecording ? 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                }}
              />
              
              {/* Middle gradient ring */}
              <div 
                className={`absolute w-64 h-64 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
                  isRecording 
                    ? 'bg-gradient-to-tr from-primary/40 via-accent/30 to-primary/40 opacity-100' 
                    : 'bg-gradient-to-tr from-primary/15 via-accent/10 to-primary/15 opacity-70'
                }`}
                style={{
                  animation: isRecording ? 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.3s' : 'none'
                }}
              />

              {/* Main orb with gradient and breathing animation */}
              <div 
                className={`relative w-56 h-56 rounded-full backdrop-blur-xl border shadow-2xl flex items-center justify-center transition-all duration-500 ${
                  isRecording
                    ? 'bg-gradient-to-br from-primary/30 via-accent/25 to-primary/35 border-primary/30 shadow-[0_0_60px_rgba(var(--primary-rgb),0.4)] cursor-pointer hover:scale-105'
                    : 'bg-gradient-to-br from-primary/15 via-accent/10 to-primary/20 border-primary/15 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]'
                }`}
                style={{
                  animation: isRecording 
                    ? 'breathe 2s ease-in-out infinite' 
                    : 'none',
                  transformOrigin: 'center'
                }}
              >
                {/* Inner gradient glow */}
                <div className={`absolute inset-12 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
                  isRecording 
                    ? 'bg-gradient-to-br from-primary/40 to-accent/30 opacity-100' 
                    : 'bg-gradient-to-br from-primary/20 to-accent/15 opacity-60'
                }`} />
                
                {/* Subtle rotating gradient overlay */}
                {isRecording && (
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                    style={{
                      animation: 'rotate 4s linear infinite'
                    }}
                  />
                )}
              </div>

              {/* Expanding rings on recording */}
              {isRecording && (
                <>
                  <div 
                    className="absolute w-56 h-56 rounded-full border-2 border-primary/20 pointer-events-none"
                    style={{
                      animation: 'expandFade 2.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }}
                  />
                  <div 
                    className="absolute w-56 h-56 rounded-full border-2 border-accent/15 pointer-events-none"
                    style={{
                      animation: 'expandFade 2.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.8s'
                    }}
                  />
                  <div 
                    className="absolute w-56 h-56 rounded-full border border-primary/10 pointer-events-none"
                    style={{
                      animation: 'expandFade 2.5s cubic-bezier(0, 0, 0.2, 1) infinite 1.6s'
                    }}
                  />
                </>
              )}
            </button>

            {!isRecording && (
              <p className="text-sm text-muted-foreground font-light">tap to speak</p>
            )}
            {isRecording && (
              <div className="space-y-4 text-center max-w-md">
                <p className="text-base text-foreground font-medium animate-pulse">Listening...</p>
                <p className="text-sm text-muted-foreground/70 font-light">Tap the orb to finish</p>
                {transcript && (
                  <p className="text-sm text-muted-foreground italic px-4">
                    "{transcript}"
                  </p>
                )}
              </div>
            )}
            {voiceStep === "processing" && (
              <p className="text-base text-foreground font-medium animate-pulse">Processing...</p>
            )}
          </div>

          <style>{`
            @keyframes breathe {
              0%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.05);
                opacity: 0.95;
              }
            }
            
            @keyframes expandFade {
              0% {
                transform: scale(1);
                opacity: 0.6;
              }
              100% {
                transform: scale(1.8);
                opacity: 0;
              }
            }
            
            @keyframes rotate {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      );
    }

    if (voiceStep === "label") {
      return (
        <div className="min-h-screen bg-background flex flex-col p-6">
          <button onClick={() => setVoiceStep("recording")} className="self-start mb-8">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
            <div className="space-y-4">
              <p className="text-base text-muted-foreground font-light italic">
                "{transcript}"
              </p>
              <p className="text-lg text-foreground font-light">
                It sounds like your tone had a bit of tension. Would you label this moment as:
              </p>
            </div>

            <div className="space-y-3">
              {[
                { Icon: Zap, label: "Unease", value: "unease" },
                { Icon: Waves, label: "Unclear", value: "unclear" },
                { Icon: Sun, label: "Aligned", value: "aligned" },
              ].map((option) => (
                <Card
                  key={option.value}
                  onClick={() => {
                    setSelectedLabel(option.value);
                    setVoiceStep("response");
                  }}
                  className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
                >
                  <div className="flex items-center gap-4">
                    <option.Icon className="w-6 h-6 text-foreground/70" strokeWidth={1.5} />
                    <span className="text-base text-foreground font-light">{option.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (voiceStep === "response") {
      return (
        <div className="min-h-screen bg-background flex flex-col p-6">
          <button onClick={() => setVoiceStep("label")} className="self-start mb-8">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
            <p className="text-lg text-foreground font-light">
              Got it. Do you want to note how you'll respond or just record the signal?
            </p>

            <div className="space-y-3">
              <Card
                onClick={() => {
                  setWantsResponse(true);
                  analyzeVoiceWithAI();
                }}
                className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
              >
                <p className="text-base text-foreground font-light">Get personalized guidance</p>
                <p className="text-sm text-muted-foreground font-light mt-2">
                  AI will analyze your voice and provide specific actions for your situation
                </p>
              </Card>

              <Card
                onClick={() => {
                  setWantsResponse(false);
                  analyzeVoiceWithAI();
                }}
                className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
              >
                <p className="text-base text-foreground font-light">Just record the signal</p>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (voiceStep === "analyzing") {
      return (
        <div className="min-h-screen bg-background flex flex-col p-6">
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-accent/15 to-primary/20 blur-2xl animate-pulse" />
              <Activity className="w-16 h-16 text-primary animate-pulse relative z-10" />
            </div>
            <div className="space-y-2">
              <p className="text-xl text-foreground font-medium">Analyzing your voice...</p>
              <p className="text-sm text-muted-foreground">Looking at tone, words, and emotional patterns</p>
            </div>
            {aiInsights && (
              <div className="max-w-md text-left space-y-2 px-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiInsights}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (voiceStep === "insights") {
      return (
        <div className="min-h-screen bg-background flex flex-col p-6 pb-24">
          <button onClick={() => navigate("/home")} className="self-start mb-4">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>

          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl text-foreground font-light">Your Gut Analysis</h1>
              <Card className="bg-card/50 border-border/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{transcript}"
                </p>
              </Card>
            </div>

            <div className="space-y-6">
              {aiInsights.split('\n').map((section, idx) => {
                const trimmed = section.trim();
                if (!trimmed) return null;
                
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
                
                // Check if it's a bullet point
                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                  return (
                    <div key={idx} className="flex gap-3 pl-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-base text-foreground/90 font-light leading-relaxed flex-1">
                        {parseBoldText(trimmed.replace(/^[•\-]\s*/, ''))}
                      </p>
                    </div>
                  );
                }
                
                // Regular paragraph
                return (
                  <p key={idx} className="text-base text-foreground/80 font-light leading-relaxed">
                    {parseBoldText(trimmed)}
                  </p>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                onClick={() => setVoiceStep("gut")}
                className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-light transition-all shadow-lg hover:shadow-xl"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (voiceStep === "gut") {
      return (
        <div className="min-h-screen bg-background flex flex-col p-6">
          <button onClick={() => setVoiceStep("insights")} className="self-start mb-8">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
            <h2 className="text-2xl font-medium text-foreground">
              What's your gut saying?
            </h2>

            <div className="space-y-3">
              {[
                { Icon: CheckCircle, label: "Yes (feels right)", value: "yes" },
                { Icon: XCircle, label: "No (something's off)", value: "no" },
                { Icon: Pause, label: "Pause (not sure yet)", value: "pause" },
              ].map((option) => (
                <Card
                  key={option.value}
                  onClick={() => {
                    setGutFeeling(option.value);
                    setVoiceStep("ignore");
                  }}
                  className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
                >
                  <div className="flex items-center gap-4">
                    <option.Icon className="w-6 h-6 text-foreground/70" strokeWidth={1.5} />
                    <span className="text-base text-foreground font-light">{option.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (voiceStep === "ignore") {
      return (
        <div className="min-h-screen bg-background flex flex-col p-6">
          <button onClick={() => setVoiceStep("gut")} className="self-start mb-8">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>

          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
            <h2 className="text-2xl font-medium text-foreground">
              Are you about to ignore it?
            </h2>

            <div className="space-y-3">
              <Card
                onClick={() => {
                  setWillIgnore("yes");
                  setVoiceStep("gentle-reminder");
                }}
                className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
              >
                <p className="text-base text-foreground font-light">Yes, I'll ignore it</p>
              </Card>

            <Card
              onClick={() => {
                setWillIgnore("no");
                setVoiceStep("congratulations");
              }}
              className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
            >
              <p className="text-base text-foreground font-light">No, I'll honor my gut</p>
            </Card>

            <Card
              onClick={() => {
                setWillIgnore("not-sure");
                setVoiceStep("congratulations");
              }}
              className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
            >
              <p className="text-base text-foreground font-light">Not sure</p>
            </Card>
            </div>
          </div>
        </div>
      );
    }
    
    if (voiceStep === "gentle-reminder") {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full space-y-12 text-center">
          {/* Bubble Logo */}
          <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <VoiceBubbleLogo size="md" animated={true} />
          </div>

            {/* Gentle Reminder Text */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '200ms' }}>
              <p className="text-xl text-foreground/90 font-light leading-relaxed">
                Why yes?
              </p>
              <p className="text-lg text-foreground/70 font-light leading-relaxed">
                Take a moment to ask yourself
              </p>
              <div className="space-y-3 pt-4">
                <p className="text-base text-foreground/60 font-light italic">
                  What do I long for?
                </p>
                <p className="text-base text-foreground/60 font-light italic">
                  Do I long to feel safe?
                </p>
                <p className="text-base text-foreground/60 font-light italic">
                  Do I long to feel connected?
                </p>
                <p className="text-base text-foreground/60 font-light italic">
                  Do I long to feel worthy?
                </p>
                <p className="text-base text-foreground/60 font-light italic">
                  Do I long to rest?
                </p>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '400ms' }}>
              <button
                onClick={handleVoiceComplete}
                className="w-full py-4 px-6 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-light transition-all border border-primary/20"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    if (voiceStep === "congratulations") {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full space-y-12 text-center">
            {/* Bubble Logo */}
            <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <VoiceBubbleLogo size="md" animated={true} />
            </div>

            {/* Congratulations Text */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '200ms' }}>
              <p className="text-xl text-foreground/90 font-light leading-relaxed">
                Congrats, {userName}!
              </p>
              <p className="text-lg text-foreground/70 font-light leading-relaxed">
                You're brave enough to trust your gut, and that courage is guiding you toward more positive outcomes.
              </p>
            </div>

            {/* Continue Button */}
            <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '400ms' }}>
              <button
                onClick={handleVoiceComplete}
                className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-light transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Tap Flow Render
  if (tapStep === "context") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <button onClick={() => navigate("/home")} className="self-start mb-8">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <h2 className="text-2xl font-medium text-foreground">
            Choose category
          </h2>

          <div className="space-y-3">
            {["Work", "Relationship", "Social", "Health", "Finance", "Entrepreneurship", "Other"].map((option) => (
              <Card
                key={option}
                onClick={() => {
                  setContext(option);
                  setTapStep("describe");
                }}
                className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
              >
                <span className="text-base text-foreground font-light">{option}</span>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-light">Or add a custom note (5 words max):</p>
            <Input
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && customNote.trim()) {
                  setContext("Custom");
                  setTapStep("describe");
                }
              }}
              placeholder="Type here..."
              className="bg-card border-border rounded-[1.25rem]"
            />
          </div>
        </div>
      </div>
    );
  }

  if (tapStep === "describe") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <button onClick={() => setTapStep("context")} className="self-start mb-8">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <h2 className="text-2xl font-medium text-foreground">
            What is happening?
          </h2>

          <div className="space-y-4">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && description.trim()) {
                  setTapStep("body");
                }
              }}
              placeholder="Describe what's happening..."
              className="bg-card border-border rounded-[1.25rem]"
            />
            
            {description.trim() && (
              <button
                onClick={() => setTapStep("body")}
                className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                continue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (tapStep === "body") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <button onClick={() => setTapStep("describe")} className="self-start mb-8">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <h2 className="text-2xl font-medium text-foreground">
            What does your body feel?
          </h2>

          <div className="space-y-3">
            {[
              { Icon: Circle, label: "Tight chest" },
              { Icon: Droplet, label: "Dropped stomach" },
              { Icon: Sparkles, label: "Expanding warmth" },
              { Icon: Cloud, label: "Numb" },
            ].map((option) => (
              <Card
                key={option.label}
                onClick={() => {
                  setBodySensation(option.label);
                  setTapStep("gut");
                }}
                className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
              >
                <div className="flex items-center gap-4">
                  <option.Icon className="w-6 h-6 text-foreground/70" strokeWidth={1.5} />
                  <span className="text-base text-foreground font-light">{option.label}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <Card className="bg-card border-border p-6 rounded-[1.25rem]">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground font-light">Add your own signal:</p>
              </div>
              <Input
                value={customSensation}
                onChange={(e) => setCustomSensation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && customSensation.trim()) {
                    setBodySensation("");
                    setTapStep("gut");
                  }
                }}
                placeholder="Describe what you feel..."
                className="bg-background border-border rounded-[1.25rem]"
              />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (tapStep === "gut") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <button onClick={() => setTapStep("body")} className="self-start mb-8">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <h2 className="text-2xl font-medium text-foreground">
            What's your gut saying?
          </h2>

          <div className="space-y-3">
            {[
              { Icon: CheckCircle, label: "Yes (feels right)", value: "yes" },
              { Icon: XCircle, label: "No (something's off)", value: "no" },
              { Icon: Pause, label: "Pause (not sure yet)", value: "pause" },
            ].map((option) => (
              <Card
                key={option.value}
                onClick={() => {
                  setGutFeeling(option.value);
                  setTapStep("ignore");
                }}
                className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
              >
                <div className="flex items-center gap-4">
                  <option.Icon className="w-6 h-6 text-foreground/70" strokeWidth={1.5} />
                  <span className="text-base text-foreground font-light">{option.label}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tapStep === "ignore") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <button onClick={() => setTapStep("gut")} className="self-start mb-8">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <h2 className="text-2xl font-medium text-foreground">
            Are you about to ignore it?
          </h2>

          <div className="space-y-3">
            <Card
              onClick={() => {
                setWillIgnore("yes");
                setTapStep("gentle-reminder");
              }}
              className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
            >
              <span className="text-base text-foreground font-light">Yes</span>
            </Card>

            <Card
              onClick={() => {
                setWillIgnore("no");
                setTapStep("congratulations");
              }}
              className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
            >
              <span className="text-base text-foreground font-light">No, I'll honor it</span>
            </Card>

            <Card
              onClick={() => {
                setWillIgnore("not-sure");
                setTapStep("congratulations");
              }}
              className="bg-card border-border p-6 cursor-pointer hover:bg-card/80 transition-colors rounded-[1.25rem]"
            >
              <span className="text-base text-foreground font-light">Not sure</span>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (tapStep === "gentle-reminder") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-12 text-center">
        {/* Bubble Logo */}
        <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <VoiceBubbleLogo size="md" animated={true} />
        </div>

          {/* Gentle Reminder Text */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '200ms' }}>
            <p className="text-xl text-foreground/90 font-light leading-relaxed">
              Why yes?
            </p>
            <p className="text-lg text-foreground/70 font-light leading-relaxed">
              Take a moment to ask yourself
            </p>
            <div className="space-y-3 pt-4">
              <p className="text-base text-foreground/60 font-light italic">
                What do I long for?
              </p>
              <p className="text-base text-foreground/60 font-light italic">
                Do I long to feel safe?
              </p>
              <p className="text-base text-foreground/60 font-light italic">
                Do I long to feel connected?
              </p>
              <p className="text-base text-foreground/60 font-light italic">
                Do I long to feel worthy?
              </p>
              <p className="text-base text-foreground/60 font-light italic">
                Do I long to rest?
              </p>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '400ms' }}>
            <button
              onClick={() => setTapStep("decision")}
              className="w-full py-4 px-6 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-light transition-all border border-primary/20"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (tapStep === "congratulations") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-12 text-center">
          {/* Bubble Logo */}
          <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <VoiceBubbleLogo size="md" animated={true} />
          </div>

          {/* Congratulations Text */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '200ms' }}>
            <p className="text-xl text-foreground/90 font-light leading-relaxed">
              Congrats, {userName}!
            </p>
            <p className="text-lg text-foreground/70 font-light leading-relaxed">
              You're brave enough to trust your gut, and that courage is guiding you toward more positive outcomes.
            </p>
          </div>

          {/* Continue Button */}
          <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '400ms' }}>
            <button
              onClick={handleTapComplete}
              className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-light transition-all shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tapStep === "decision") {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <button onClick={() => setTapStep("ignore")} className="self-start mb-8">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-medium text-foreground">
              What will you do instead?
            </h2>
            <p className="text-sm text-muted-foreground font-light">
              Optional: Track your decision to see the consequences later
            </p>
          </div>

          <div className="space-y-4">
            <Textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="E.g., 'I'll pause before responding' or 'I'll decline the offer'..."
              className="bg-card border-border rounded-[1.25rem] min-h-[100px]"
            />

            <div className="space-y-2">
              {decision.trim() && (
                <button
                  onClick={handleTapComplete}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-[1.25rem] font-light hover:bg-primary/90 transition-colors"
                >
                  Track this decision
                </button>
              )}
              
              <button
                onClick={handleTapComplete}
                className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
              >
                skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CheckIn;
