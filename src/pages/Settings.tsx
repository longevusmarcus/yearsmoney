import { useState, useEffect } from "react";
import { ArrowLeft, User, LogOut, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <h1 className="text-2xl font-cursive italic text-foreground tracking-tight">Settings</h1>

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
  );
};

export default Settings;