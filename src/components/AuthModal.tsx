import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, ArrowRight } from "lucide-react";

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
        toast({ title: "Welcome back!" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
          },
        });
        if (error) throw error;
        toast({ title: "Account created!" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-light text-foreground mb-1">
            {isLogin ? "Welcome back" : "Get started"}
          </h2>
          <p className="text-sm text-muted-foreground font-light">
            Save your financial data securely
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "..." : isLogin ? "Sign in" : "Create account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground font-light mt-4">
          {isLogin ? "No account? " : "Have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-foreground hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
