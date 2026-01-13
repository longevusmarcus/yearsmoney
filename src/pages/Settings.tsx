import { useState, useEffect } from "react";
import { ArrowLeft, User, Bell, Lock, Palette, Trash2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [weeklyInsights, setWeeklyInsights] = useState(true);

  useEffect(() => {
    loadProfile();
    loadPreferences();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  };

  const loadPreferences = () => {
    const daily = localStorage.getItem("dailyReminders");
    const weekly = localStorage.getItem("weeklyInsights");
    if (daily !== null) setDailyReminders(daily === "true");
    if (weekly !== null) setWeeklyInsights(weekly === "true");
  };

  const handleClearData = () => {
    if (confirm("Are you sure? This will delete all your check-ins.")) {
      localStorage.removeItem("gutEntries");
      localStorage.removeItem("lastDailyGuidance");
      toast({
        title: "Data cleared",
        description: "All your check-ins have been deleted",
      });
    }
  };

  const toggleDailyReminders = (value: boolean) => {
    setDailyReminders(value);
    localStorage.setItem("dailyReminders", String(value));
    toast({
      title: value ? "Reminders enabled" : "Reminders disabled",
      description: value ? "You'll get daily check-in reminders" : "Daily reminders turned off",
    });
  };

  const toggleWeeklyInsights = (value: boolean) => {
    setWeeklyInsights(value);
    localStorage.setItem("weeklyInsights", String(value));
    toast({
      title: value ? "Insights enabled" : "Insights disabled",
      description: value ? "You'll get weekly insight summaries" : "Weekly insights turned off",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <h1 className="text-4xl font-cursive text-foreground tracking-tight">Settings</h1>

        {/* Account */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-light">
            account
          </h2>
          
          <Card
            onClick={() => navigate("/profile")}
            className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4 cursor-pointer hover:bg-card/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-foreground">Profile</p>
              <p className="text-sm text-muted-foreground font-light">
                {profile?.first_name || "Edit your profile"}
              </p>
            </div>
          </Card>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-light">
            notifications
          </h2>
          
          <Card className="bg-card border-border p-4 rounded-[1.25rem]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-foreground/70" />
                <div>
                  <p className="text-base font-light text-foreground">Daily reminders</p>
                  <p className="text-xs text-muted-foreground font-light">Get reminded to check in</p>
                </div>
              </div>
              <Switch checked={dailyReminders} onCheckedChange={toggleDailyReminders} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-foreground/70" />
                <div>
                  <p className="text-base font-light text-foreground">Weekly insights</p>
                  <p className="text-xs text-muted-foreground font-light">Get pattern summaries</p>
                </div>
              </div>
              <Switch checked={weeklyInsights} onCheckedChange={toggleWeeklyInsights} />
            </div>
          </Card>
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-light">
            appearance
          </h2>
          
          <Card className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Palette className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-foreground">Theme</p>
              <p className="text-sm text-muted-foreground font-light">System default</p>
            </div>
          </Card>
        </div>

        {/* Privacy */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-light">
            privacy
          </h2>
          
          <Card className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-foreground">Data privacy</p>
              <p className="text-sm text-muted-foreground font-light">All data stored locally</p>
            </div>
          </Card>

          <Card
            onClick={handleClearData}
            className="bg-card border-border p-4 rounded-[1.25rem] flex items-center gap-4 cursor-pointer hover:bg-destructive/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-base font-light text-destructive">Clear all data</p>
              <p className="text-sm text-muted-foreground font-light">Delete all check-ins</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;