import { useState, useEffect } from "react";
import { User, LogOut, LogIn, Trash2, Trophy, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import MobileOnly from "@/components/MobileOnly";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const Settings = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthUser();
  const [leaderboardPublic, setLeaderboardPublic] = useState(
    () => localStorage.getItem("tc_leaderboard_display") === "public"
  );
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("tc_display_name") ?? "");
  const [savingName, setSavingName] = useState(false);
  const [loadingPreference, setLoadingPreference] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      .select("leaderboard_display, nickname, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      if (data.leaderboard_display) {
        const isPublic = data.leaderboard_display === "public";
        setLeaderboardPublic(isPublic);
        localStorage.setItem("tc_leaderboard_display", isPublic ? "public" : "anonymous");
      }
      const name =
        data.nickname?.trim() ||
        [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
      if (name) {
        setDisplayName(name);
        localStorage.setItem("tc_display_name", name);
      }
    }
    setLoadingPreference(false);
  };

  const handleSaveDisplayName = async () => {
    if (!user) return;
    const value = displayName.trim();
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, nickname: value || null }, { onConflict: "id" });
    setSavingName(false);

    if (error) {
      toast({
        title: t("app.settings.errorTitle"),
        description: t("app.settings.errUpdatePreference"),
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem("tc_display_name", value);
    toast({ title: t("app.settings.saved") });
  };


  const handleLeaderboardToggle = async (checked: boolean) => {
    if (!user) return;

    const value = checked ? "public" : "anonymous";
    setLeaderboardPublic(checked);
    localStorage.setItem("tc_leaderboard_display", value);

    // upsert so the preference persists even if the profile row is missing
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, leaderboard_display: value }, { onConflict: "id" });

    if (error) {
      setLeaderboardPublic(!checked);
      localStorage.setItem("tc_leaderboard_display", checked ? "anonymous" : "public");
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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("no session");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) throw new Error("request failed");

      await supabase.auth.signOut();
      localStorage.removeItem("tc_income");
      localStorage.removeItem("tc_expenses");
      localStorage.removeItem("tc_networth");
      localStorage.removeItem("tc_onboarding_done");
      setDeleteOpen(false);
      toast({
        title: t("app.settings.deletedTitle"),
        description: t("app.settings.deletedDesc"),
      });
      navigate("/");
    } catch (e) {
      toast({
        title: t("app.settings.errorTitle"),
        description: t("app.settings.errDeleteAccount"),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
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

              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <label className="text-xs font-light text-muted-foreground" htmlFor="display-name">
                  {t("app.settings.displayNameLabel")}
                </label>
                <div className="flex gap-2">
                  <input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("app.settings.displayNamePlaceholder")}
                    maxLength={40}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-light text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={handleSaveDisplayName}
                    disabled={savingName}
                    className="rounded-xl border border-border px-4 text-sm font-light text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    {t("app.settings.save")}
                  </button>
                </div>
                <p className="text-xs font-light text-muted-foreground">
                  {t("app.settings.displayNameHint")}
                </p>
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

        {/* Danger zone */}
        {user && (
          <div className="space-y-3">
            <h2 className="text-[10px] uppercase tracking-wider text-destructive/70 font-light">
              {t("app.settings.dangerZone")}
            </h2>

            <Card
              onClick={() => setDeleteOpen(true)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border-destructive/30 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-light text-destructive">{t("app.settings.deleteAccount")}</p>
                <p className="text-xs font-light text-muted-foreground">
                  {t("app.settings.deleteAccountSub")}
                </p>
              </div>
            </Card>
          </div>
        )}

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="max-w-[92vw] rounded-3xl border-border bg-card sm:max-w-[420px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-lg">
                {t("app.settings.deleteAccountConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-light">
                {t("app.settings.deleteAccountConfirmDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="rounded-full">
                {t("app.settings.deleteAccountCancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteAccount();
                }}
                disabled={deleting}
                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? t("app.settings.deleting") : t("app.settings.deleteAccountConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



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