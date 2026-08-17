import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Trash2,
  Calculator,
  Search,
  Plane,
  Palmtree,
  GraduationCap,
  Home,
  TrendingDown,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import yearsLogo from "@/assets/years-logo.webp";
import { APP_ENTRY } from "@/components/landing/appEntry";


/* ================== DATA ================== */

const CITIES = [
  "Milano, Italia",
  "Milazzo, Italia",
  "Milano Marittima, Italia",
  "Roma, Italia",
  "Torino, Italia",
  "Napoli, Italia",
  "Bologna, Italia",
  "Firenze, Italia",
  "Bari, Italia",
  "Palermo, Italia",
  "Verona, Italia",
  "Padova, Italia",
  "Genova, Italia",
  "Catania, Italia",
  "Lugano, Svizzera",
  "Londra, Regno Unito",
  "Berlino, Germania",
  "Barcellona, Spagna",
];

const DESIRES = [
  "Più libertà nelle mie scelte",
  "Costruire un patrimonio",
  "Avere il controllo dei miei soldi",
  "Più tempo per me",
  "Girare il mondo",
  "Vivere con meno, e meglio",
  "Altro",
];

const AGES = ["18 – 25", "26 – 35", "36 – 49", "50+", "Preferisco non dirlo"];

const SITUATIONS = [
  "Studente",
  "Dipendente",
  "Imprenditore",
  "Libero professionista o P.IVA",
  "In cerca di lavoro",
  "Pensionato",
  "Altro",
];

const GOALS = [
  "Comprare casa",
  "Viaggiare di più",
  "Avviare un'attività",
  "Non dipendere più da uno stipendio",
  "Smettere di lavorare prima",
  "Sostenere la mia famiglia",
  "Altro",
];

const INCOMES = [
  "Meno di 1.000€",
  "1.000 – 2.999€",
  "3.000 – 6.999€",
  "7.000€ o più",
  "Inserisco l'importo preciso",
];

const SAVINGS = [
  "Niente, per ora",
  "Meno del 10%",
  "Tra il 10% e il 30%",
  "Più del 30%",
  "Non lo so ancora",
  "Inserisco l'importo preciso",
];

const RISK = ["Sicurezza", "Equilibrio", "Crescita"];

const INCOME_BASE: Record<string, number> = {
  "Meno di 1.000€": 900,
  "1.000 – 2.999€": 1000,
  "3.000 – 6.999€": 3000,
  "7.000€ o più": 7000,
  "Inserisco l'importo preciso": 0,
};

const SAVE_RATE: Record<string, number> = {
  "Niente, per ora": 0,
  "Meno del 10%": 0.07,
  "Tra il 10% e il 30%": 0.2,
  "Più del 30%": 0.35,
  "Non lo so ancora": 0.1,
  "Inserisco l'importo preciso": 0,
};

const AGE_START: Record<string, number> = {
  "18 – 25": 23,
  "26 – 35": 30,
  "36 – 49": 42,
  "50+": 55,
  "Preferisco non dirlo": 35,
};

const RISK_RETURN: Record<string, number> = {
  Sicurezza: 0.02,
  Equilibrio: 0.045,
  Crescita: 0.07,
};

type Answers = {
  desires: string[];
  age: string;
  city: string;
  situation: string;
  goal: string;
  income: string;
  incomeExact: string;
  wealth: string;
  saving: string;
  savingExact: string;
  risk: string;
};

const EMPTY: Answers = {
  desires: [],
  age: "",
  city: "",
  situation: "",
  goal: "",
  income: "",
  incomeExact: "",
  wealth: "",
  saving: "",
  savingExact: "",
  risk: "Equilibrio",
};

/* screens: 0..4 = steps 1-5, 5 = trust, 6..9 = steps 6-9, 10 = plan */
const STEP_LABEL: (string | null)[] = [
  "PASSO 1 DI 9 · APERTURA",
  "PASSO 2 DI 9 · ETÀ",
  "PASSO 3 DI 9 · LUOGO",
  "PASSO 4 DI 9 · SITUAZIONE",
  "PASSO 5 DI 9 · OBIETTIVO",
  "PRIMA DEI NUMERI · FIDUCIA",
  "PASSO 6 DI 9 · REDDITO",
  "PASSO 7 DI 9 · PATRIMONIO",
  "PASSO 8 DI 9 · RISPARMIO",
  "PASSO 9 DI 9 · PROPENSIONE",
  null,
];
const PROGRESS = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 9];

/* ================== PAGE ================== */

export default function Onboarding() {
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setA((p) => ({ ...p, [k]: v }));

  const next = () => setI((v) => Math.min(v + 1, 10));
  const back = () => setI((v) => Math.max(v - 1, 0));

  const canNext = [
    a.desires.length === 2,
    !!a.age,
    !!a.city,
    !!a.situation,
    !!a.goal,
    true,
    !!a.income && (a.income !== "Inserisco l'importo preciso" || Number(a.incomeExact) > 0),
    Number(a.wealth) >= 0 && a.wealth.trim() !== "",
    !!a.saving && (a.saving !== "Inserisco l'importo preciso" || Number(a.savingExact) > 0),
    !!a.risk,
    true,
  ][i];

  const plan = usePlan(a);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Blobs />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={yearsLogo} alt="Logo YEARS" className="h-9 w-9 object-contain" />
            <span className="font-display text-sm tracking-[0.28em]">YEARS</span>
          </Link>
          {i > 0 && i < 10 && (
            <button
              onClick={back}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Indietro
            </button>
          )}
        </header>

        {i < 10 && (
          <div className="mt-6">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[oklch(0.90_0.13_55)] via-[oklch(0.74_0.16_295)] to-[oklch(0.60_0.17_300)]"
                animate={{ width: `${(PROGRESS[i] / 9) * 100}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
              />
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
              {STEP_LABEL[i]}
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-1 flex-col pt-8"
            >
              {i === 0 && (
                <Question title="Cosa vuoi cambiare nei tuoi prossimi anni?" hint="Scegline due">
                  <div className="space-y-2">
                    {DESIRES.map((d) => (
                      <Option
                        key={d}
                        label={d}
                        selected={a.desires.includes(d)}
                        onClick={() => {
                          const has = a.desires.includes(d);
                          if (has) set("desires", a.desires.filter((x) => x !== d));
                          else if (a.desires.length < 2) set("desires", [...a.desires, d]);
                          else set("desires", [a.desires[1], d]);
                        }}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 1 && (
                <Question title="Quanti anni hai?" hint="Selezione singola">
                  <div className="space-y-2">
                    {AGES.map((x) => (
                      <Option
                        key={x}
                        label={x}
                        selected={a.age === x}
                        onClick={() => set("age", x)}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 2 && (
                <Question title="Dove vivi?" hint="Città">
                  <CityField value={a.city} onChange={(v) => set("city", v)} />
                </Question>
              )}

              {i === 3 && (
                <Question title="Cosa fai adesso?" hint="Selezione singola">
                  <div className="space-y-2">
                    {SITUATIONS.map((x) => (
                      <Option
                        key={x}
                        label={x}
                        selected={a.situation === x}
                        onClick={() => set("situation", x)}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 4 && (
                <Question title="Qual è il tuo traguardo più importante?" hint="Selezione singola">
                  <div className="space-y-2">
                    {GOALS.map((x) => (
                      <Option
                        key={x}
                        label={x}
                        selected={a.goal === x}
                        onClick={() => set("goal", x)}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 5 && <Trust />}

              {i === 6 && (
                <Question title="Quanto entra ogni mese, netto?" hint="Selezione singola">
                  <div className="space-y-2">
                    {INCOMES.map((x) => (
                      <Option
                        key={x}
                        label={x}
                        selected={a.income === x}
                        onClick={() => set("income", x)}
                      />
                    ))}
                  </div>
                  {a.income === "Inserisco l'importo preciso" && (
                    <div className="mt-3">
                      <AmountField
                        value={a.incomeExact}
                        onChange={(v) => set("incomeExact", v)}
                        placeholder="Es. 2.450"
                        suffix="€ / mese"
                      />
                    </div>
                  )}
                </Question>
              )}

              {i === 7 && (
                <Question
                  title="Quanto hai di patrimonio liquido?"
                  hint="Patrimonio liquido · importo"
                >
                  <AmountField
                    value={a.wealth}
                    onChange={(v) => set("wealth", v)}
                    placeholder="Es. 18.500"
                    suffix="€"
                  />
                  <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                    Considera liquidità sul conto e investimenti facilmente liquidabili. Escludi la
                    casa in cui vivi e i beni non vendibili in fretta.
                  </p>
                </Question>
              )}

              {i === 8 && (
                <Question
                  title="Quanto riesci a mettere da parte ogni mese?"
                  hint="Scelta + equivalente €"
                >
                  <div className="space-y-2">
                    {SAVINGS.map((x) => {
                      const base = incomeValue(a);
                      const exactIncome = a.income === "Inserisco l'importo preciso";
                      const eur = Math.round(base * (SAVE_RATE[x] ?? 0));
                      const spesa = Math.max(base - eur, 0);
                      return (
                        <Option
                          key={x}
                          label={x}
                          selected={a.saving === x}
                          onClick={() => set("saving", x)}
                          meta={
                            x === "Inserisco l'importo preciso"
                              ? undefined
                              : base > 0
                                ? exactIncome
                                  ? `${eur}€/mese da parte · ${spesa}€/mese di spese`
                                  : eur > 0
                                    ? `fino a ${eur}€/mese`
                                    : undefined
                                : undefined
                          }
                        />
                      );
                    })}
                  </div>
                  {a.saving === "Inserisco l'importo preciso" && (
                    <div className="mt-3">
                      <AmountField
                        value={a.savingExact}
                        onChange={(v) => set("savingExact", v)}
                        placeholder="Es. 450"
                        suffix="€ / mese"
                      />
                    </div>
                  )}
                  {a.income && (
                    <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                      {a.income === "Inserisco l'importo preciso"
                        ? `Calcolati sull'importo che hai inserito (${incomeValue(a).toLocaleString("it-IT")}€/mese).`
                        : "Equivalenti calcolati sul minimo della fascia di reddito scelta al passo 6."}
                    </p>
                  )}
                </Question>
              )}

              {i === 9 && (
                <Question
                  title="Quanto del presente vuoi investire nel futuro?"
                  hint="Slider a tre punti"
                >
                  <RiskSlider value={a.risk} onChange={(v) => set("risk", v)} />
                </Question>
              )}

              {i === 10 && <Plan plan={plan} />}
            </motion.div>
          </AnimatePresence>

          {i < 10 && (
            <div className="sticky bottom-4 pt-6">
              <button
                onClick={next}
                disabled={!canNext}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-medium text-black transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-30"
              >
                {i === 5 ? "Ho capito, continuiamo" : i === 9 ? "Crea il mio piano" : "Avanti"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================== PIECES ================== */

function Question({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {hint && (
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">{hint}</div>
      )}
      <h1 className="font-display text-[1.9rem] font-medium leading-[1.15] tracking-tight">
        {title}
      </h1>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Option({
  label,
  selected,
  onClick,
  meta,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  meta?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-colors ${
        selected
          ? "border-white/40 bg-white/[0.10] text-white"
          : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20"
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {meta && <span className="mt-0.5 block text-[11px] text-white/40">{meta}</span>}
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-white bg-white text-black" : "border-white/20"
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

function AmountField({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  const n = Number(value);
  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 focus-within:border-white/25">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={100000000}
          step={100}
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 9);
            onChange(raw);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent font-display text-2xl font-medium text-white placeholder-white/25 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="shrink-0 text-sm text-white/45">{suffix}</span>}
      </div>
      {value !== "" && Number.isFinite(n) && (
        <div className="mt-2 text-[11px] text-white/40">{n.toLocaleString("it-IT")} €</div>
      )}
    </div>
  );
}

function incomeValue(a: Answers): number {
  if (a.income === "Inserisco l'importo preciso") return Math.max(Number(a.incomeExact) || 0, 0);
  return INCOME_BASE[a.income] ?? 2200;
}

function savingValue(a: Answers): number {
  if (a.saving === "Inserisco l'importo preciso") return Math.max(Number(a.savingExact) || 0, 0);
  const income = incomeValue(a);
  return Math.round(income * (SAVE_RATE[a.saving] ?? 0.1));
}

function CityField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState(value);
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s || s === value.toLowerCase()) return [];
    return CITIES.filter((c) => c.toLowerCase().includes(s)).slice(0, 5);
  }, [q, value]);

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onChange("");
          }}
          placeholder="Cerca la tua città"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-white/25"
        />
      </div>
      <div className="mt-2 space-y-2">
        {matches.map((c) => (
          <button
            key={c}
            onClick={() => {
              onChange(c);
              setQ(c);
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/80 hover:border-white/25"
          >
            {c}
          </button>
        ))}
      </div>
      {value && (
        <div className="mt-3 text-[11px] text-white/40">
          Paese e valuta arrivano dalle impostazioni del dispositivo. Nessun permesso GPS richiesto.
        </div>
      )}
    </div>
  );
}

function Trust() {
  const rows = [
    {
      icon: Calculator,
      t: "Ti chiediamo due dati",
      d: "Quanto entra ogni mese e quanto riesci a mettere da parte.",
    },
    {
      icon: Lock,
      t: "Servono solo a calcolare il tuo piano",
      d: "Nessun altro uso, nessuna condivisione con terzi.",
    },
    {
      icon: Trash2,
      t: "Puoi cancellarli quando vuoi",
      d: "Dal tuo profilo, in qualsiasi momento, senza motivare la scelta.",
    },
  ];
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
        Prima di continuare
      </div>
      <h1 className="font-display text-[1.9rem] font-medium leading-[1.15] tracking-tight">
        Adesso parliamo di numeri.
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Due domande. Ecco cosa succede alle tue risposte.
      </p>
      <div className="mt-7 space-y-3">
        {rows.map((r) => (
          <div
            key={r.t}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
              <r.icon className="h-4 w-4 text-white/80" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <div className="text-sm text-white">{r.t}</div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-white/50">{r.d}</div>
            </div>
          </div>
        ))}
      </div>
      <Link
        to="/privacy"
        className="mt-4 inline-block text-xs text-white/50 underline hover:text-white"
      >
        Leggi l'informativa completa
      </Link>
    </div>
  );
}

function RiskSlider({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const idx = Math.max(RISK.indexOf(value), 0);
  return (
    <div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
        <div className="flex justify-between text-[11px] text-white/45">
          <span>Tenere di più oggi</span>
          <span>Costruire di più domani</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx}
          onChange={(e) => onChange(RISK[Number(e.target.value)])}
          className="mt-4 w-full accent-white"
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {RISK.map((r) => (
            <button
              key={r}
              onClick={() => onChange(r)}
              className={`rounded-full border px-2 py-2 text-[11px] transition-colors ${
                value === r
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-white/40">
        Fissa il profilo di rischio, quindi il rendimento atteso della proiezione.
      </p>
    </div>
  );
}

/* ================== PLAN ================== */

type PlanData = {
  ageNow: number;
  yearsNow: number;
  monthsNow: number;
  years10: number;
  months10: number;
  gained: number;
};

function usePlan(a: Answers): PlanData {
  return useMemo(() => {
    const ageNow = AGE_START[a.age] ?? 35;
    const income = incomeValue(a);
    const monthly = savingValue(a);
    const wealth = Math.max(Number(a.wealth) || 0, 0);
    const r = RISK_RETURN[a.risk] ?? 0.045;
    const m = r / 12;
    const n = 120; // 10 anni
    const spend = Math.max(income - monthly, income * 0.1, 1) * 12;
    const future =
      wealth * Math.pow(1 + m, n) + (monthly > 0 ? monthly * ((Math.pow(1 + m, n) - 1) / m) : 0);

    const freedomNow = wealth / spend;
    const freedom10 = future / spend;
    const split = (v: number) => {
      const years = Math.floor(Math.max(v, 0));
      const months = Math.round((Math.max(v, 0) - years) * 12);
      return months === 12 ? { years: years + 1, months: 0 } : { years, months };
    };
    const a1 = split(freedomNow);
    const a2 = split(freedom10);
    return {
      ageNow,
      yearsNow: a1.years,
      monthsNow: a1.months,
      years10: a2.years,
      months10: a2.months,
      gained: Math.max(Math.round(freedom10 - freedomNow), 0),
    };
  }, [a]);
}

function Plan({ plan }: { plan: PlanData }) {
  const points = useMemo(() => {
    const start = plan.yearsNow + plan.monthsNow / 12;
    const end = plan.years10 + plan.months10 / 12;
    return Array.from({ length: 11 }, (_, k) => {
      const t = k / 10;
      return start + (end - start) * Math.pow(t, 1.6);
    });
  }, [plan]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Sintesi</div>
      <h1 className="mt-2 font-display text-[2rem] font-medium leading-[1.12] tracking-tight">
        La tua libertà, <span className="logo-gradient-text">in anni</span>.
      </h1>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">Oggi</div>
        <div className="mt-1 font-display text-5xl font-medium">
          <span className="logo-gradient-text">
            {plan.yearsNow}a {plan.monthsNow}m
          </span>
        </div>
        <div className="text-sm text-white/60">di libertà già guadagnati</div>
        <FreedomChart points={points} />
      </div>

      <div className="relative mt-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div aria-hidden className="select-none blur-md">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">Fra 10 anni</div>
          <div className="mt-1 font-display text-4xl font-medium">
            <span className="logo-gradient-text">
              {plan.years10}a {plan.months10}m
            </span>
          </div>
          <div className="text-sm text-white/60">
            +{plan.gained} anni di libertà se continui così
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 text-center">
          <Lock className="h-4 w-4 text-white/70" />
          <div className="text-sm font-medium text-white/90">La proiezione fra 10 anni</div>
          <div className="text-[11px] text-white/50">Sbloccala creando il tuo profilo</div>
        </div>
      </div>

      <TimeSpendList plan={plan} />
      <TimeRiskList />

      <p className="mt-4 text-[11px] leading-relaxed text-white/40">
        Proiezione basata sulle tue risposte: patrimonio liquido, risparmio mensile e propensione
        scelta. Tutto è misurato in tempo, non in denaro.
      </p>

      <div className="mt-auto space-y-3 pt-8">
        <Link
          to={APP_ENTRY}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-medium text-black transition-transform hover:-translate-y-0.5"
        >
          Inizia il mio percorso
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

const SPEND_ITEMS = [
  { icon: Palmtree, label: "Anno sabbatico", months: 12, hint: "Fermarti un anno intero" },
  { icon: Plane, label: "Giro del mondo", months: 6, hint: "Sei mesi di viaggio lento" },
  { icon: GraduationCap, label: "Riqualificarti", months: 4, hint: "Studiare a tempo pieno" },
  {
    icon: Home,
    label: "Lavorare solo su un progetto tuo",
    months: 18,
    hint: "Un anno e mezzo senza stipendio",
  },
];

function fmtMonths(m: number) {
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r}m`;
  return r === 0 ? `${y}a` : `${y}a ${r}m`;
}

function TimeSpendList({ plan }: { plan: PlanData }) {
  const budget = plan.yearsNow * 12 + plan.monthsNow;
  return (
    <div className="mt-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        Cosa puoi farci · budget {fmtMonths(budget)}
      </div>
      <div className="mt-3 space-y-2">
        {SPEND_ITEMS.map((it, idx) => {
          const locked = idx >= 2;
          const pct = budget > 0 ? Math.min(100, Math.round((it.months / budget) * 100)) : 100;
          const affordable = budget >= it.months;
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur"
            >
              <div className={locked ? "select-none blur-[6px]" : ""} aria-hidden={locked}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                    <Icon className="h-4 w-4 text-white/80" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white/90">{it.label}</div>
                    <div className="truncate text-[11px] text-white/45">{it.hint}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm">
                      <span className="logo-gradient-text">−{fmtMonths(it.months)}</span>
                    </div>
                    <div className="text-[10px] text-white/40">
                      {affordable ? `${pct}% del budget` : "fuori portata"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[oklch(0.55_0.24_295)] to-[oklch(0.78_0.17_60)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {locked && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20 text-center">
                  <Lock className="h-3.5 w-3.5 text-white/70" />
                  <span className="text-[11px] text-white/70">Sbloccalo creando il profilo</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const RISK_ITEMS = [
  {
    icon: CreditCard,
    label: "Lifestyle creep",
    hint: "Spese fisse che crescono con lo stipendio",
    cost: "−2a 6m",
    locked: false,
  },
  {
    icon: TrendingDown,
    label: "Restare liquido troppo a lungo",
    hint: "L'inflazione erode il tuo tempo",
    cost: "−1a 8m",
    locked: false,
  },
  {
    icon: AlertTriangle,
    label: "Un imprevisto senza riserva",
    hint: "Debito per coprire l'emergenza",
    cost: "−3a",
    locked: true,
  },
];

function TimeRiskList() {
  return (
    <div className="mt-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        Cosa può togliertela
      </div>
      <div className="mt-3 space-y-2">
        {RISK_ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.label}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur"
            >
              <div className={it.locked ? "select-none blur-[6px]" : ""} aria-hidden={it.locked}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className="h-4 w-4 text-white/70" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white/85">{it.label}</div>
                    <div className="truncate text-[11px] text-white/45">{it.hint}</div>
                  </div>
                  <div className="font-display text-sm text-white/80">{it.cost}</div>
                </div>
              </div>
              {it.locked && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20 text-center">
                  <Lock className="h-3.5 w-3.5 text-white/70" />
                  <span className="text-[11px] text-white/70">Sbloccalo creando il profilo</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FreedomChart({ points }: { points: number[] }) {
  const max = Math.max(...points, 0.1);
  const w = 280;
  const h = 80;
  const coords = points.map((v, k) => {
    const x = (k / (points.length - 1)) * w;
    const y = h - (v / max) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M ${coords.join(" L ")}`;
  return (
    <div className="mt-5">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="freedomFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.19 55)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="oklch(0.55 0.24 295)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="freedomLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.55 0.24 295)" />
            <stop offset="100%" stopColor="oklch(0.78 0.17 60)" />
          </linearGradient>
        </defs>
        <path d={`${line} L ${w},${h} L 0,${h} Z`} fill="url(#freedomFill)" />
        <path
          d={line}
          fill="none"
          stroke="url(#freedomLine)"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.16em] text-white/35">
        <span>Oggi</span>
        <span>+5 anni</span>
        <span>+10 anni</span>
      </div>
    </div>
  );
}

function Blobs() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-[-10%] h-[420px] w-[420px] rounded-full bg-[oklch(0.72_0.19_55/0.20)] blur-[120px]" />
      <div className="absolute top-1/2 right-[-15%] h-[520px] w-[520px] rounded-full bg-[oklch(0.55_0.24_295/0.20)] blur-[140px]" />
      <div className="absolute bottom-[-10%] left-1/4 h-[360px] w-[360px] rounded-full bg-[oklch(0.70_0.16_180/0.14)] blur-[120px]" />
    </div>
  );
}
