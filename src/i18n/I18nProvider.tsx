import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionary, type Lang } from "./dictionary";

const STORAGE_KEY = "years_lang";
const DEFAULT_LANG: Lang = "it";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Look up a dot-path, e.g. `t("hero.headline")`. Falls back to Italian, then the key. */
  t: (key: string) => string;
  /** Same lookup for dictionary entries that hold a list of strings. */
  tList: (key: string) => string[];
};

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "it" ? stored : DEFAULT_LANG;
}

function lookup(lang: Lang, key: string): unknown {
  const walk = (source: unknown) =>
    key.split(".").reduce<unknown>((node, part) => {
      if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
        return (node as Record<string, unknown>)[part];
      }
      return undefined;
    }, source);

  const hit = walk(dictionary[lang]);
  // Italian is the source of truth, so an untranslated English key still renders copy
  return hit ?? (lang === "it" ? undefined : walk(dictionary.it));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private-mode storage failures shouldn't break the switch
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const t = (key: string) => {
      const hit = lookup(lang, key);
      if (typeof hit === "string") return hit;
      if (import.meta.env.DEV && hit === undefined) {
        console.warn(`[i18n] missing key "${key}" for "${lang}"`);
      }
      return typeof hit === "string" ? hit : key;
    };

    const tList = (key: string) => {
      const hit = lookup(lang, key);
      if (Array.isArray(hit)) return hit as string[];
      if (import.meta.env.DEV) console.warn(`[i18n] "${key}" is not a list for "${lang}"`);
      return [];
    };

    return { lang, setLang, t, tList };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
