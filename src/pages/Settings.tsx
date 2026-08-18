import { useState, useEffect } from "react";
import { User, LogOut, LogIn, Trash2, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import MobileOnly from "@/components/MobileOnly";
import { useI18n } from "@/i18n/I18nProvider";

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthUser();
  const [leaderboardPublic, setLeaderboardPublic] = useState(false);
  const [loadingPreference, setLoadingPreference] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchLeaderboardPreference(user.id);
    } else {
      setLoadingPreference(false);
    }
  }, [user, authLoading]);


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
        title: t("app.settings.errorTitle"),
        description: t("app.settings.errUpdatePreference"),
        variant: "destructive",
      });
    } else {
      toast({
        title: checked ? t("app.settings.publicNameTitle") : t("app.settings.anonymousTitle"),
        description: checked
          ? t("app.settings.publicNameDesc")
          : t("app.settings.anonymousDesc"),
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t("app.settings.errorTitle"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      localStorage.removeItem("tc_income");
      localStorage.removeItem("tc_expenses");
      localStorage.removeItem("tc_networth");
      toast({
        title: t("app.settings.signedOutTitle"),
        description: t("app.settings.signedOutDesc"),
      });
      navigate("/home");
    }
  };

  const handleClearData = () => {
    if (confirm(t("app.settings.clearConfirm"))) {
      localStorage.removeItem("tc_income");
      localStorage.removeItem("tc_expenses");
      localStorage.removeItem("tc_networth");
      toast({
        title: t("app.settings.clearedTitle"),
        description: t("app.settings.clearedDesc"),
      });
    }
  };

  return (
    <MobileOnly>
    <div className="min-h-screen bg-transparent pb-24">
      <PageHeader 
        title={t("app.settings.title")}
        titleClassName="text-2xl font-cursive italic text-foreground tracking-tight"
        showBackButton 
        showActions={false} 
      />
      
      <div className="px-6 space-y-6">

        {/* Account */}
        <div className="space-y-3">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">
            {t("app.settings.account")}
          </h2>
          
          {user ? (
            <Card className="bg-card border-border p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground font-light">{t("app.settings.signedIn")}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-light text-foreground hover:bg-muted/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t("app.settings.signOut")}
              </button>
            </Card>
          ) : (
            <Card className="bg-card border-border p-4 rounded-2xl">
              <p className="mb-4 text-center text-sm font-light text-muted-foreground">
                {t("app.settings.signInPrompt")}
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-white to-white/80 py-2.5 text-sm font-medium text-black transition-transform hover:-translate-y-0.5"
              >
                <LogIn className="h-4 w-4" />
                {t("app.settings.signIn")}
              </button>
            </Card>
          )}
        </div>

        {/* Leaderboard */}
        {user && (
          <div className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-light">
              {t("app.settings.leaderboard")}
            </h2>
            
            <Card className="bg-card border-border p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-light text-foreground">{t("app.settings.showFullName")}</p>
                    <p className="text-xs text-muted-foreground font-light">
                      {leaderboardPublic ? t("app.settings.public") : t("app.settings.anonymousShort")}
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
            {t("app.settings.data")}
          </h2>

          <Card
            onClick={handleClearData}
            className="bg-card border-border p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-destructive/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-light text-destructive">{t("app.settings.clearAll")}</p>
              <p className="text-xs text-muted-foreground font-light">{t("app.settings.clearAllSub")}</p>
            </div>
          </Card>
        </div>

        {/* App Info */}
        <div className="pt-6 text-center">
          <p className="text-xs text-muted-foreground font-light">{t("app.settings.version")}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">years.money</p>
        </div>
      </div>
    </div>
    </MobileOnly>
  );
};

export default Settings;