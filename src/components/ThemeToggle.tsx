import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent/10 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-foreground" strokeWidth={1.5} />
      ) : (
        <Moon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
      )}
    </button>
  );
};
