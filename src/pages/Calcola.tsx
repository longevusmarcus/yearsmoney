import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut, Eye, EyeOff } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import yearsLogo from "@/assets/years-logo.webp";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Calcola() {
  return <MobileApp />;
}

function MobileApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-black" />;
  if (!session) return <AuthScreen />;
  return <Simulator onSignOut={() => supabase.auth.signOut()} email={session.user.email ?? ""} />;
}

/* ================== AUTH ================== */

function AuthScreen() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/calcola` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e?.message ?? t("calcola.genericError"));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErr(result.error.message || t("calcola.googleError"));
      return;
    }
    if (result.redirected) return;
    window.location.href = "/calcola";
  };


  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <BgBlobs />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-11 w-11 object-contain" />
            <span className="font-grotesk text-xl tracking-[0.28em]">YEARS</span>
          </div>
          <LanguageSwitcher />
        </div>

        <h1 className="font-grotesk text-3xl font-bold leading-tight">
          {mode === "signin" ? t("calcola.welcomeBack") : t("calcola.createProfile")}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {mode === "signin"
            ? t("calcola.signInSub")
            : t("calcola.signUpSub")}
        </p>

        <button
          onClick={google}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3.5 text-sm font-medium text-black transition-transform hover:-translate-y-0.5"
        >
          <GoogleIcon />
          {t("calcola.continueGoogle")}
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/40">
          <span className="h-px flex-1 bg-white/10" />
          {t("calcola.or")}
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
placeholder={t("calcola.email")}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/25"
          />
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
placeholder={t("calcola.password")}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-11 text-sm text-white placeholder-white/40 outline-none focus:border-white/25"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/50 hover:text-white"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {err && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-white/20 px-5 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-60"
          >
            {busy ? "…" : mode === "signin" ? t("calcola.signIn") : t("calcola.createAccount")}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErr(null);
          }}
          className="mt-6 text-center text-xs text-white/50 hover:text-white"
        >
          {mode === "signin" ? t("calcola.noAccount") : t("calcola.haveAccount")}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.5 2.5 30.1 0 24 0 14.7 0 6.7 5.4 2.8 13.2l7.9 6.1C12.6 13.3 17.8 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 7-10.4 7-17.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.7 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.5 0 20.1 0 24s1 7.5 2.8 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.1 0 11.3-2 15-5.5l-7.7-6c-2.1 1.4-4.8 2.3-7.3 2.3-6.2 0-11.4-3.8-13.3-9.3l-7.9 6.1C6.7 42.6 14.7 48 24 48z"
      />
    </svg>
  );
}

/* ================== SIMULATOR ================== */

/** Prices are data; the label and category are resolved per language at render time. */
type ItemCost = { id: string; price: number; category: string };

const CATALOG: ItemCost[] = [
  { id: "coffee", price: 1.5, category: "daily" },
  { id: "dinner", price: 35, category: "dining" },
  { id: "netflix", price: 15, category: "subscriptions" },
  { id: "gym", price: 45, category: "subscriptions" },
  { id: "iphone", price: 1200, category: "electronics" },
  { id: "macbook", price: 1500, category: "electronics" },
  { id: "paris", price: 600, category: "travel" },
  { id: "greece", price: 2000, category: "travel" },
  { id: "usedCar", price: 8000, category: "big" },
  { id: "newCar", price: 25000, category: "big" },
  { id: "houseDeposit", price: 40000, category: "big" },
  { id: "sabbatical", price: 20000, category: "projects" },
  { id: "masters", price: 15000, category: "projects" },
];

function Simulator({ onSignOut, email }: { onSignOut: () => void; email: string }) {
  const { t } = useI18n();
  const [reddito, setReddito] = useState(2200);
  const [spese, setSpese] = useState(1600);
  const [risparmi, setRisparmi] = useState(15000);
  const [q, setQ] = useState("");

  const risparmioMese = Math.max(reddito - spese, 0);
  const orePerMese = 160; // full time indicative
  const valoreOra = reddito > 0 ? reddito / orePerMese : 0;

  // Survival Time: quanti mesi resisto se smetto di guadagnare
  const mesiSurvival = spese > 0 ? risparmi / spese : 0;
  const survY = Math.floor(mesiSurvival / 12);
  const survM = Math.floor(mesiSurvival - survY * 12);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return CATALOG;
    return CATALOG.filter(
      (i) =>
        t(`calcola.items.${i.id}`).toLowerCase().includes(s) ||
        t(`calcola.categories.${i.category}`).toLowerCase().includes(s),
    );
  }, [q, t]);

  const timeFor = (price: number) => {
    if (valoreOra <= 0) return { hours: 0, label: "—" };
    const hours = price / valoreOra;
    if (hours < 1) return { hours, label: `${Math.round(hours * 60)} ${t("calcola.units.min")}` };
    if (hours < 8) return { hours, label: `${hours.toFixed(1)} ${t("calcola.units.hours")}` };
    const days = hours / 8;
    if (days < 5) return { hours, label: `${days.toFixed(1)} ${t("calcola.units.days")}` };
    const weeks = days / 5;
    if (weeks < 8) return { hours, label: `${weeks.toFixed(1)} ${t("calcola.units.weeks")}` };
    const months = weeks / 4.33;
    if (months < 18) return { hours, label: `${months.toFixed(1)} ${t("calcola.units.months")}` };
    const years = months / 12;
    return { hours, label: `${years.toFixed(1)} ${t("calcola.units.years")}` };
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <BgBlobs />
      <div className="relative z-10 mx-auto max-w-md px-5 pb-24 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-9 w-9 object-contain" />
            <span className="font-grotesk text-sm tracking-[0.28em]">YEARS</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("calcola.signOut")}
            </button>
          </div>
        </header>

        <div className="mt-1 text-[11px] text-white/40">{email}</div>

        <h1 className="mt-6 font-grotesk text-3xl font-bold leading-tight">
          {t("calcola.title")}
        </h1>

        <section className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <NumberField
label={t("calcola.incomeLabel")}
            value={reddito}
            onChange={setReddito}
            suffix={t("common.currency")}
          />
          <NumberField label={t("calcola.expensesLabel")} value={spese} onChange={setSpese} suffix={t("common.currency")} />
          <NumberField label={t("calcola.savingsLabel")} value={risparmi} onChange={setRisparmi} suffix={t("common.currency")} />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <Metric
            label={t("calcola.survivalTime")}
            value={`${survY}${t("common.yearShort")} ${survM}${t("common.monthShort")}`}
            tone="cold"
          />
          <Metric label={t("calcola.hourValue")} value={`${t("common.currency")} ${valoreOra.toFixed(1)}`} tone="warm" />
          <Metric label={t("calcola.savingPerMonth")} value={`${t("common.currency")} ${risparmioMese}`} tone="warm" />
          <Metric label={t("calcola.optionalPerYear")} value={`${t("common.currency")} ${risparmioMese * 12}`} tone="cold" />
        </section>

        <section className="mt-8">
          <div className="mb-3 text-xs uppercase tracking-widest text-white/40">
            {t("calcola.whatToBuy")}
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
placeholder={t("calcola.searchPlaceholder")}
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-white/25"
            />
          </div>

          <div className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((it) => {
                const cost = timeFor(it.price);
                return (
                  <motion.div
                    key={it.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <div className="text-sm text-white">{t(`calcola.items.${it.id}`)}</div>
                      <div className="text-[11px] uppercase tracking-widest text-white/40">
                        {t(`calcola.categories.${it.category}`)} · {t("common.currency")}{" "}
                        {it.price.toLocaleString(t("common.locale"))}
                      </div>
                    </div>
                    <div className="logo-gradient-text font-grotesk text-right text-lg font-bold">
                      {cost.label}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/50">
                {t("calcola.noResults")} "{q}"
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
        {suffix && <span className="text-white/50">{suffix}</span>}
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full bg-transparent text-lg font-medium text-white outline-none"
        />
      </div>
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "warm" | "cold" }) {
  // Warm = the gold end of the YEARS gradient, cold = the violet-blue end.
  const color = tone === "warm" ? "oklch(0.72 0.19 55)" : "oklch(0.70 0.16 220)";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-1 font-grotesk text-xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function BgBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-[-10%] h-[420px] w-[420px] rounded-full bg-[oklch(0.72_0.19_55/0.22)] blur-[120px]" />
      <div className="absolute top-1/2 right-[-15%] h-[520px] w-[520px] rounded-full bg-[oklch(0.55_0.24_295/0.22)] blur-[140px]" />
      <div className="absolute bottom-[-10%] left-1/4 h-[360px] w-[360px] rounded-full bg-[oklch(0.70_0.16_180/0.18)] blur-[120px]" />
    </div>
  );
}
