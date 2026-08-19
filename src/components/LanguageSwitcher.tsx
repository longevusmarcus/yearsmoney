import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const LANGS = [
  { code: "it" as const, label: "IT" },
  { code: "en" as const, label: "EN" },
];

/**
 * Two-state IT / EN pill. The choice persists in localStorage and applies to the whole
 * product — landing, onboarding and the app screens all read from the same context.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Mobile dropdown: globe icon + current language, with a menu below.
  if (isMobile) {
    return (
      <div ref={containerRef} className={cn("relative inline-flex shrink-0", className)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t("common.language")}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-sm font-medium tracking-[0.04em] text-white backdrop-blur-md transition-colors hover:bg-white/10"
        >
          <Globe className="h-3.5 w-3.5" />
          {lang === "it" ? "IT" : "EN"}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 min-w-[5.5rem] overflow-hidden rounded-2xl border border-white/15 bg-[#1c1c1c] py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm font-medium tracking-[0.04em] transition-colors",
                  lang === code
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {label}
                {lang === code && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-full border border-white/15 bg-white/5 p-0.5 backdrop-blur-md",
        className,
      )}
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            "h-full rounded-full px-3 text-sm font-medium tracking-[0.08em] transition-colors",
            lang === code
              ? "bg-white text-black"
              : "text-white/60 hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
