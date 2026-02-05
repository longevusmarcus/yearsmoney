import { useState, useEffect } from "react";
import { User, LogOut, Trash2, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Switch } from "@/components/ui/switch";
import MobileOnly from "@/components/MobileOnly";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [leaderboardPublic, setLeaderboardPublic] = useState(false);
  const [loadingPreference, setLoadingPreference] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchLeaderboardPreference(session.user.id);
      } else {
        setLoadingPreference(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchLeaderboardPreference(session.user.id);
      } else {
        setLoadingPreference(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchLeaderboardPreference = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("leaderboard_display")
      .eq("id", userId)
      .single();
    
    if (!error && data) {
      setLeaderboardPublic(data.leaderboard_display === "public");
    }
    setLoadingPreference(false);
  };

  const handleLeaderboardToggle = async (checked: boolean) => {
    if (!user) return;
    
    setLeaderboardPublic(checked);
    const { error } = await supabase
      .from("profiles")
      .update({ leaderboard_display: checked ? "public" : "anonymous" })
      .eq("id", user.id);
    
    if (error) {
      setLeaderboardPublic(!checked);
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      });
    } else {
      toast({
        title: checked ? "Public name" : "Anonymous",
        description: checked 
          ? "Your full name will show on leaderboard" 
          : "Only 3 letters will show on leaderboard",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      localStorage.removeItem("tc_income");
      localStorage.removeItem("tc_expenses");
      localStorage.removeItem("tc_networth");
      toast({
        title: "Signed out",
        description: "You've been signed out successfully",
      });
      navigate("/home");
    }
  };

  const handleClearData = () => {
    if (confirm("Are you sure? This will clear all your saved data.")) {
      localStorage.removeItem("tc_income");
      localStorage.removeItem("tc_expenses");
      localStorage.removeItem("tc_networth");
      toast({
        title: "Data cleared",
        description: "All your data has been cleared",
      });
    }
  };

  return (
    <MobileOnly>
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Settings" 
        titleClassName="text-2xl font-cursive italic text-foreground tracking-tight"
        showBackButton 
        showActions={false} 
      />
      
      <div className="px-6 space-y-6">

        {/* Account */}
        <div className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">
            account
          </h2>
          
          {user ? (
            <Card className="bg-card border-border p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground font-light">Signed in</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-light text-foreground hover:bg-muted/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </Card>
          ) : (
            <Card className="bg-card border-border p-4 rounded-2xl">
              <p className="text-sm text-muted-foreground font-light text-center">
                Not signed in
              </p>
            </Card>
          )}
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">
            appearance
          </h2>
          
          <Card className="bg-card border-border p-4 rounded-2xl flex items-center justify-between">
            <p className="text-sm font-light text-foreground">Theme</p>
            <ThemeToggle />
          </Card>
        </div>

        {/* Leaderboard */}
        {user && (
          <div className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">
              leaderboard
            </h2>
            
            <Card className="bg-card border-border p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-light text-foreground">Show full name</p>
                    <p className="text-xs text-muted-foreground font-light">
                      {leaderboardPublic ? "Public" : "Anonymous (3 letters)"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={leaderboardPublic}
                  onCheckedChange={handleLeaderboardToggle}
                  disabled={loadingPreference}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Data */}
        <div className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">
            data
          </h2>

          <Card
            onClick={handleClearData}
            className="bg-card border-border p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-destructive/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-light text-destructive">Clear all data</p>
              <p className="text-xs text-muted-foreground font-light">Remove saved financial data</p>
            </div>
          </Card>
        </div>

        {/* App Info */}
        <div className="pt-6 text-center">
          <p className="text-xs text-muted-foreground font-light">Years v1.0</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">years.money</p>
        </div>
      </div>
    </div>
    </MobileOnly>
  );
};

export default Settings;