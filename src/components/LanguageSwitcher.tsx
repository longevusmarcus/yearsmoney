import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

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

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-white/15 bg-white/5 p-0.5 backdrop-blur-md",
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
            "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] transition-colors",
            lang === code ? "bg-white text-black" : "text-white/60 hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
