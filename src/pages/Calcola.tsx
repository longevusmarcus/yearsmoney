import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LogOut, Eye, EyeOff } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import yearsLogo from "@/assets/years-logo.webp";
import { supabase } from "@/integrations/supabase/client";

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
      setErr(e?.message ?? "Errore");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setErr(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/calcola` },
    });
    if (error) setErr(error.message || "Errore Google");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <BgBlobs />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 flex items-center gap-2.5">
          <img src={yearsLogo} alt="Logo YEARS" className="h-11 w-11 object-contain" />
          <span className="font-grotesk text-xl tracking-[0.28em]">YEARS</span>
        </div>

        <h1 className="font-grotesk text-3xl font-bold leading-tight">
          {mode === "signin" ? "Bentornato." : "Crea il tuo profilo."}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {mode === "signin"
            ? "Accedi per aprire il tuo simulatore."
            : "Un account per salvare i tuoi calcoli e scenari."}
        </p>

        <button
          onClick={google}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3.5 text-sm font-medium text-black transition-transform hover:-translate-y-0.5"
        >
          <GoogleIcon />
          Continua con Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/40">
          <span className="h-px flex-1 bg-white/10" />
          oppure
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/25"
          />
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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
            {busy ? "…" : mode === "signin" ? "Accedi" : "Crea account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErr(null);
          }}
          className="mt-6 text-center text-xs text-white/50 hover:text-white"
        >
          {mode === "signin" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
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

type ItemCost = { label: string; price: number; category: string };

const CATALOG: ItemCost[] = [
  { label: "Caffè al bar", price: 1.5, category: "Quotidiano" },
  { label: "Cena fuori", price: 35, category: "Uscite" },
  { label: "Netflix (mese)", price: 15, category: "Abbonamenti" },
  { label: "Palestra (mese)", price: 45, category: "Abbonamenti" },
  { label: "iPhone 15 Pro", price: 1200, category: "Elettronica" },
  { label: "MacBook Air", price: 1500, category: "Elettronica" },
  { label: "Weekend a Parigi", price: 600, category: "Viaggi" },
  { label: "Vacanza in Grecia", price: 2000, category: "Viaggi" },
  { label: "Auto usata", price: 8000, category: "Grandi" },
  { label: "Auto nuova", price: 25000, category: "Grandi" },
  { label: "Anticipo casa", price: 40000, category: "Grandi" },
  { label: "Anno sabbatico", price: 20000, category: "Progetti" },
  { label: "Master", price: 15000, category: "Progetti" },
];

function Simulator({ onSignOut, email }: { onSignOut: () => void; email: string }) {
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
      (i) => i.label.toLowerCase().includes(s) || i.category.toLowerCase().includes(s),
    );
  }, [q]);

  const timeFor = (price: number) => {
    if (valoreOra <= 0) return { hours: 0, label: "—" };
    const hours = price / valoreOra;
    if (hours < 1) return { hours, label: `${Math.round(hours * 60)} min` };
    if (hours < 8) return { hours, label: `${hours.toFixed(1)} ore` };
    const days = hours / 8;
    if (days < 5) return { hours, label: `${days.toFixed(1)} giornate` };
    const weeks = days / 5;
    if (weeks < 8) return { hours, label: `${weeks.toFixed(1)} settimane` };
    const months = weeks / 4.33;
    if (months < 18) return { hours, label: `${months.toFixed(1)} mesi` };
    const years = months / 12;
    return { hours, label: `${years.toFixed(1)} anni` };
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <BgBlobs />
      <div className="relative z-10 mx-auto max-w-md px-5 pb-24 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={yearsLogo} alt="Logo YEARS" className="h-9 w-9 object-contain" />
            <span className="font-grotesk text-sm tracking-[0.28em]">YEARS</span>
          </div>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Esci
          </button>
        </header>

        <div className="mt-1 text-[11px] text-white/40">{email}</div>

        <h1 className="mt-6 font-grotesk text-3xl font-bold leading-tight">
          Quanto tempo comprano i tuoi soldi?
        </h1>

        <section className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <NumberField
            label="Reddito mensile netto"
            value={reddito}
            onChange={setReddito}
            suffix="€"
          />
          <NumberField label="Spese mensili" value={spese} onChange={setSpese} suffix="€" />
          <NumberField label="Risparmi attuali" value={risparmi} onChange={setRisparmi} suffix="€" />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <Metric label="Survival Time" value={`${survY}a ${survM}m`} tone="cold" />
          <Metric label="Valore ora" value={`€ ${valoreOra.toFixed(1)}`} tone="warm" />
          <Metric label="Risparmio/mese" value={`€ ${risparmioMese}`} tone="warm" />
          <Metric label="Optional/anno" value={`€ ${risparmioMese * 12}`} tone="cold" />
        </section>

        <section className="mt-8">
          <div className="mb-3 text-xs uppercase tracking-widest text-white/40">
            Cosa vuoi comprare?
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca: caffè, iPhone, viaggio…"
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-white/25"
            />
          </div>

          <div className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((it) => {
                const t = timeFor(it.price);
                return (
                  <motion.div
                    key={it.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <div className="text-sm text-white">{it.label}</div>
                      <div className="text-[11px] uppercase tracking-widest text-white/40">
                        {it.category} · € {it.price.toLocaleString("it-IT")}
                      </div>
                    </div>
                    <div className="logo-gradient-text font-grotesk text-right text-lg font-bold">
                      {t.label}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/50">
                Nessun risultato per "{q}"
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
