import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-1 hover:opacity-70 transition-opacity"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
      ) : (
        <Moon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
      )}
    </button>
  );
};
