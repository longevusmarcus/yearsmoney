import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import VoiceBubbleLogo from "@/components/VoiceBubbleLogo";
import { Star } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for password reset token in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (accessToken && type === "recovery") {
      setIsResettingPassword(true);
      return;
    }

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/home");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsResettingPassword(true);
      } else if (session) {
        navigate("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResettingPassword) {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) throw error;

        toast({
          title: "Password updated!",
          description: "Your password has been reset successfully.",
        });

        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);
        setIsResettingPassword(false);
        navigate("/home");
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              nickname: nickname,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to Hara.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-3 h-3 rounded-full bg-accent/20 animate-pulse"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        />
        <div
          className="absolute top-40 right-20 w-2 h-2 rounded-full bg-primary/30 animate-pulse"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-2.5 h-2.5 rounded-full bg-secondary/25 animate-pulse"
          style={{ animationDelay: "2s", animationDuration: "3.5s" }}
        />
        <div
          className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-accent/15 animate-pulse"
          style={{ animationDelay: "1.5s", animationDuration: "5s" }}
        />
      </div>

      <div className="w-full max-w-md relative">
        {/* Voice bubble logo and branding */}
        <div className="text-center mb-4">
          <div className="mb-3 flex justify-center animate-in fade-in zoom-in duration-700">
            <VoiceBubbleLogo size="sm" animated={true} />
          </div>
          <h1
            className="text-2xl font-cursive text-foreground tracking-tight mb-1 animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "200ms" }}
          >
            Welcome to Hara
          </h1>
          <p
            className="text-sm text-muted-foreground/70 font-light animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: "300ms" }}
          >
            Learn to trust your gut (hara) and make decisions that feel right.
          </p>
        </div>

        {/* Auth form card */}
        <div
          className="backdrop-blur-xl bg-card/40 border border-border/30 rounded-[1.5rem] p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700"
          style={{ animationDelay: "400ms" }}
        >
          {/* Rating display */}
          <div className="text-center mb-4 animate-in fade-in duration-700" style={{ animationDelay: "500ms" }}>
            <p className="text-xs text-muted-foreground/70 mb-1.5">My creators rated me</p>
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-primary text-primary" />
                ))}
                <div className="relative">
                  <Star className="w-4 h-4 text-muted-foreground/20" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: "80%" }}>
                    <Star className="w-4 h-4 fill-primary text-primary" />
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-foreground">4.8 out of 5</span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            {isResettingPassword && (
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-foreground mb-1">Set new password</h2>
                <p className="text-xs text-muted-foreground">Enter your new password below</p>
              </div>
            )}
            {!isLogin && !isForgotPassword && !isResettingPassword && (
              <div>
                <Input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  className="bg-background/60 border-border/40 rounded-[1rem] h-10 text-sm placeholder:text-muted-foreground/60"
                />
              </div>
            )}
            {!isResettingPassword && (
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/60 border-border/40 rounded-[1rem] h-10 text-sm placeholder:text-muted-foreground/60"
                />
              </div>
            )}
            {(!isForgotPassword || isResettingPassword) && (
              <div>
                <Input
                  type="password"
                  placeholder={isResettingPassword ? "New password" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/60 border-border/40 rounded-[1rem] h-10 text-sm placeholder:text-muted-foreground/60"
                />
                {(!isLogin || isResettingPassword) && (
                  <p className="text-xs text-muted-foreground/70 mt-1 ml-1">8+ characters recommended</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1rem] h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
            >
              {loading
                ? "Loading..."
                : isResettingPassword
                  ? "Update password"
                  : isForgotPassword
                    ? "Send reset link"
                    : isLogin
                      ? "Sign in"
                      : "Get started"}
            </Button>
          </form>

          {!isResettingPassword && !isForgotPassword && (
            <>
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full rounded-[1rem] h-10 text-sm font-medium bg-background/60 border-border/40 hover:bg-background/80"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          {!isResettingPassword && (
            <div className="mt-4 text-center space-y-2">
              {isLogin && !isForgotPassword && (
                <button
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground/80 font-light hover:text-foreground transition-colors block w-full"
                >
                  Forgot password?
                </button>
              )}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setIsForgotPassword(false);
                }}
                className="text-sm text-muted-foreground/80 font-light hover:text-foreground transition-colors"
              >
                {isForgotPassword
                  ? "Back to sign in"
                  : isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                <span className="text-primary font-medium">
                  {isForgotPassword ? "" : isLogin ? "Sign up" : "Sign in"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer text */}
        <p
          className="text-center text-xs text-muted-foreground/60 mt-4 animate-in fade-in duration-700"
          style={{ animationDelay: "600ms" }}
        >
          Check our{" "}
          <a href="/about" className="text-primary hover:underline">
            About
          </a>{" "}
          and{" "}
          <a href="/faq" className="text-primary hover:underline">
            FAQs
          </a>
          . By continuing, you agree to Hara's{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>
          ,{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="/cookie" className="text-primary hover:underline">
            Cookie Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Auth;
