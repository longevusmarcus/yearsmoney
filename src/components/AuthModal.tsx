import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Welcome back" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
          },
        });
        if (error) throw error;
        toast({ title: "Account created" });
      }
      onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - slides up from bottom on mobile */}
      <div className="relative w-full sm:max-w-xs bg-card border-t sm:border border-border/50 sm:rounded-2xl p-6 pb-8 sm:pb-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 sm:fade-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Minimal header */}
        <p className="text-sm text-muted-foreground font-light mb-5">
          {isLogin ? "Sign in" : "Create account"}
        </p>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent border-b border-border/50 px-0 py-2.5 text-sm font-light focus:outline-none focus:border-foreground/40 placeholder:text-muted-foreground/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-transparent border-b border-border/50 px-0 py-2.5 text-sm font-light focus:outline-none focus:border-foreground/40 placeholder:text-muted-foreground/50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background rounded-lg py-2.5 text-sm font-light mt-4 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "..." : isLogin ? "Continue" : "Create"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-xs text-muted-foreground/60 font-light mt-4">
          {isLogin ? "New here? " : "Have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
