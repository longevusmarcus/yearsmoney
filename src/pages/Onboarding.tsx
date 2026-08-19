import { useEffect, useMemo, useState } from "react";
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
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUserFinances } from "@/hooks/useUserFinances";

/* ================== OPTION MODEL ==================
 * Options are identified by stable ids, never by their labels. The projection maths
 * below keys off these ids, so switching language cannot change a calculation — an
 * earlier version keyed `INCOME_BASE` and friends off the Italian display strings.
 */

const DESIRE_IDS = ["freedom", "wealth", "control", "time", "world", "less", "other"] as const;
const AGE_IDS = ["a18_25", "a26_35", "a36_49", "a50", "undisclosed"] as const;
const SITUATION_IDS = [
  "student",
  "employee",
  "founder",
  "freelance",
  "seeking",
  "retired",
  "other",
] as const;
const GOAL_IDS = [
  "house",
  "travel",
  "business",
  "independence",
  "retireEarly",
  "family",
  "other",
] as const;
const INCOME_IDS = ["under1000", "b1000", "b3000", "b7000", "exact"] as const;
const SAVING_IDS = ["none", "under10", "b10_30", "over30", "unknown", "exact"] as const;
const RISK_IDS = ["safety", "balance", "growth"] as const;

type AgeId = (typeof AGE_IDS)[number];
type IncomeId = (typeof INCOME_IDS)[number];
type SavingId = (typeof SAVING_IDS)[number];
type RiskId = (typeof RISK_IDS)[number];

const EXACT = "exact";

const INCOME_BASE: Record<IncomeId, number> = {
  under1000: 900,
  b1000: 1000,
  b3000: 3000,
  b7000: 7000,
  exact: 0,
};

const SAVE_RATE: Record<SavingId, number> = {
  none: 0,
  under10: 0.07,
  b10_30: 0.2,
  over30: 0.35,
  unknown: 0.1,
  exact: 0,
};

const AGE_START: Record<AgeId, number> = {
  a18_25: 23,
  a26_35: 30,
  a36_49: 42,
  a50: 55,
  undisclosed: 35,
};

const RISK_RETURN: Record<RiskId, number> = {
  safety: 0.02,
  balance: 0.045,
  growth: 0.07,
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
  risk: number;
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
  risk: 1,
};

/* screens: 0..4 = steps 1-5, 5 = trust, 6..9 = steps 6-9, 10 = plan */
const PROGRESS = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 9];

/* ================== PAGE ================== */

export default function Onboarding() {
  const { t, tList } = useI18n();
  const [i, setI] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setA((p) => ({ ...p, [k]: v }));

  const next = () => setI((v) => Math.min(v + 1, 10));
  const back = () => setI((v) => Math.max(v - 1, 0));

  const stepLabels = tList("onboarding.steps");
  const cur = t("common.currency");
  // "€ / mese" -> "mese"; the unit word alone, for inline "450€/mese" style meta
  const per = t("onboarding.perMonthSuffix").split("/").pop()?.trim() ?? "";

  const canNext = [
    a.desires.length === 2,
    !!a.age,
    !!a.city,
    !!a.situation,
    !!a.goal,
    true,
    !!a.income && (a.income !== EXACT || Number(a.incomeExact) > 0),
    Number(a.wealth) >= 0 && a.wealth.trim() !== "",
    !!a.saving && (a.saving !== EXACT || Number(a.savingExact) > 0),
    !!a.risk,
    true,
  ][i];

  const plan = usePlan(a);

  // Persist onboarding results so the Home dashboard shows the same numbers.
  const { updateFinances } = useUserFinances();
  useEffect(() => {
    if (i !== 10) return;
    const income = incomeValue(a);
    const savings = savingValue(a);
    const expenses = Math.max(income - savings, 0);
    const netWorth = Math.max(Number(a.wealth) || 0, 0);
    localStorage.setItem("tc_onboarding_done", "1");
    updateFinances({
      monthlyIncome: income,
      monthlyExpenses: expenses,
      netWorth,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Blobs />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-9 w-9 object-contain" />
            <span className="font-display text-sm tracking-[0.28em]">YEARS</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {i > 0 && i < 10 && (
              <button
                onClick={back}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {t("onboarding.back")}
              </button>
            )}
          </div>
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
              {stepLabels[i]}
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
                <Question title={t("onboarding.q.desires")} hint={t("onboarding.q.desiresHint")}>
                  <div className="space-y-2">
                    {DESIRE_IDS.map((id) => (
                      <Option
                        key={id}
                        label={t(`onboarding.desires.${id}`)}
                        selected={a.desires.includes(id)}
                        onClick={() => {
                          const has = a.desires.includes(id);
                          if (has) set("desires", a.desires.filter((x) => x !== id));
                          else if (a.desires.length < 2) set("desires", [...a.desires, id]);
                          else set("desires", [a.desires[1], id]);
                        }}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 1 && (
                <Question title={t("onboarding.q.age")} hint={t("onboarding.q.single")}>
                  <div className="space-y-2">
                    {AGE_IDS.map((id) => (
                      <Option
                        key={id}
                        label={t(`onboarding.ages.${id}`)}
                        selected={a.age === id}
                        onClick={() => set("age", id)}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 2 && (
                <Question title={t("onboarding.q.city")} hint={t("onboarding.q.cityHint")}>
                  <CityField value={a.city} onChange={(v) => set("city", v)} />
                </Question>
              )}

              {i === 3 && (
                <Question title={t("onboarding.q.situation")} hint={t("onboarding.q.single")}>
                  <div className="space-y-2">
                    {SITUATION_IDS.map((id) => (
                      <Option
                        key={id}
                        label={t(`onboarding.situations.${id}`)}
                        selected={a.situation === id}
                        onClick={() => set("situation", id)}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 4 && (
                <Question title={t("onboarding.q.goal")} hint={t("onboarding.q.single")}>
                  <div className="space-y-2">
                    {GOAL_IDS.map((id) => (
                      <Option
                        key={id}
                        label={t(`onboarding.goals.${id}`)}
                        selected={a.goal === id}
                        onClick={() => set("goal", id)}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {i === 5 && <Trust />}

              {i === 6 && (
                <Question title={t("onboarding.q.income")} hint={t("onboarding.q.single")}>
                  <div className="space-y-2">
                    {INCOME_IDS.map((id) => (
                      <Option
                        key={id}
                        label={t(`onboarding.incomes.${id}`)}
                        selected={a.income === id}
                        onClick={() => set("income", id)}
                      />
                    ))}
                  </div>
                  {a.income === EXACT && (
                    <div className="mt-3">
                      <AmountField
                        value={a.incomeExact}
                        onChange={(v) => set("incomeExact", v)}
                        placeholder={t("onboarding.amountExampleIncome")}
                        suffix={t("onboarding.perMonthSuffix")}
                      />
                    </div>
                  )}
                </Question>
              )}

              {i === 7 && (
                <Question title={t("onboarding.q.wealth")} hint={t("onboarding.q.wealthHint")}>
                  <AmountField
                    value={a.wealth}
                    onChange={(v) => set("wealth", v)}
                    placeholder={t("onboarding.amountExampleWealth")}
                    suffix={t("onboarding.euroSuffix")}
                  />
                  <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                    {t("onboarding.q.wealthNote")}
                  </p>
                </Question>
              )}

              {i === 8 && (
                <Question title={t("onboarding.q.saving")} hint={t("onboarding.q.savingHint")}>
                  <div className="space-y-2">
                    {SAVING_IDS.map((id) => {
                      const base = incomeValue(a);
                      const exactIncome = a.income === EXACT;
                      const eur = Math.round(base * (SAVE_RATE[id] ?? 0));
                      const spesa = Math.max(base - eur, 0);
                      return (
                        <Option
                          key={id}
                          label={t(`onboarding.savings.${id}`)}
                          selected={a.saving === id}
                          onClick={() => set("saving", id)}
                          meta={
                            id === EXACT
                              ? undefined
                              : base > 0
                                ? exactIncome
                                  ? `${eur}${cur}/${per} ${t("onboarding.savingSetAside")} · ${spesa}${cur}/${per} ${t("onboarding.savingSpending")}`
                                  : eur > 0
                                    ? `${t("onboarding.savingUpTo")} ${eur}${cur}`
                                    : undefined
                                : undefined
                          }
                        />
                      );
                    })}
                  </div>
                  {a.saving === EXACT && (
                    <div className="mt-3">
                      <AmountField
                        value={a.savingExact}
                        onChange={(v) => set("savingExact", v)}
                        placeholder={t("onboarding.amountExampleSaving")}
                        suffix={t("onboarding.perMonthSuffix")}
                      />
                    </div>
                  )}
                  {a.income && (
                    <p className="mt-3 text-[11px] leading-relaxed text-white/40">
                      {a.income === EXACT
                        ? `${t("onboarding.savingNoteExact")} (${incomeValue(a).toLocaleString(t("common.locale"))}${cur}).`
                        : t("onboarding.savingNoteBand")}
                    </p>
                  )}
                </Question>
              )}

              {i === 9 && (
                <Question title={t("onboarding.q.risk")} hint={t("onboarding.q.riskHint")}>
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
                {i === 5
                  ? t("onboarding.understood")
                  : i === 9
                    ? t("onboarding.createPlan")
                    : t("onboarding.next")}
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
  const { t } = useI18n();
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
        <div className="mt-2 text-[11px] text-white/40">{n.toLocaleString(t("common.locale"))} {t("common.currency")}</div>
      )}
    </div>
  );
}

function incomeValue(a: Answers): number {
  if (a.income === EXACT) return Math.max(Number(a.incomeExact) || 0, 0);
  return INCOME_BASE[a.income as IncomeId] ?? 2200;
}

function savingValue(a: Answers): number {
  if (a.saving === EXACT) return Math.max(Number(a.savingExact) || 0, 0);
  const income = incomeValue(a);
  return Math.round(income * (SAVE_RATE[a.saving as SavingId] ?? 0.1));
}

function CityField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t, tList } = useI18n();
  const cities = tList("onboarding.cities");
  const [q, setQ] = useState(value);
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s || s === value.toLowerCase()) return [];
    return cities.filter((c) => c.toLowerCase().includes(s)).slice(0, 5);
  }, [q, value, cities]);

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
          placeholder={t("onboarding.citySearch")}
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
      {value && <div className="mt-3 text-[11px] text-white/40">{t("onboarding.cityNote")}</div>}
    </div>
  );
}

function Trust() {
  const { t } = useI18n();
  const rows = [
    { icon: Calculator, t: t("onboarding.trust.row1Title"), d: t("onboarding.trust.row1Desc") },
    { icon: Lock, t: t("onboarding.trust.row2Title"), d: t("onboarding.trust.row2Desc") },
    { icon: Trash2, t: t("onboarding.trust.row3Title"), d: t("onboarding.trust.row3Desc") },
  ];
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
        {t("onboarding.trust.before")}
      </div>
      <h1 className="font-display text-[1.9rem] font-medium leading-[1.15] tracking-tight">
        {t("onboarding.trust.title")}
      </h1>
      <p className="mt-2 text-sm text-white/60">{t("onboarding.trust.sub")}</p>
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
        {t("onboarding.trust.readPolicy")}
      </Link>
    </div>
  );
}

function RiskSlider({ value, onChange }: { value: RiskId; onChange: (v: RiskId) => void }) {
  const { t } = useI18n();
  const idx = Math.max(RISK_IDS.indexOf(value), 0);
  return (
    <div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
        <div className="flex justify-between text-[11px] text-white/45">
          <span>{t("onboarding.riskLess")}</span>
          <span>{t("onboarding.riskMore")}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={idx}
          onChange={(e) => onChange(RISK_IDS[Number(e.target.value)])}
          className="mt-4 w-full accent-white"
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {RISK_IDS.map((id) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`rounded-full border px-2 py-2 text-[11px] transition-colors ${
                value === id
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {t(`onboarding.risks.${id}`)}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-white/40">{t("onboarding.riskNote")}</p>
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
    const ageNow = AGE_START[a.age as AgeId] ?? 35;
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
  const { t } = useI18n();
  const yr = t("common.yearShort");
  const mo = t("common.monthShort");
  const points = useMemo(() => {
    const start = plan.yearsNow + plan.monthsNow / 12;
    const end = plan.years10 + plan.months10 / 12;
    return Array.from({ length: 11 }, (_, k) => {
      const t2 = k / 10;
      return start + (end - start) * Math.pow(t2, 1.6);
    });
  }, [plan]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        {t("onboarding.plan.summary")}
      </div>
      <h1 className="mt-2 font-display text-[2rem] font-medium leading-[1.12] tracking-tight">
        {t("onboarding.plan.titleBefore")}{" "}
        <span className="logo-gradient-text">{t("onboarding.plan.titleHighlight")}</span>.
      </h1>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
          {t("onboarding.plan.today")}
        </div>
        <div className="mt-1 font-display text-5xl font-medium">
          <span className="logo-gradient-text inline-block">
            {plan.yearsNow}{yr} {plan.monthsNow}{mo}
          </span>
        </div>
        <div className="text-sm text-white/60">{t("onboarding.plan.alreadyEarned")}</div>
        <FreedomChart points={points} />
      </div>

      <div className="relative mt-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div aria-hidden className="select-none blur-md">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            {t("onboarding.plan.inTenYears")}
          </div>
          <div className="mt-1 font-display text-4xl font-medium">
            <span className="logo-gradient-text inline-block">
              {plan.years10}{yr} {plan.months10}{mo}
            </span>
          </div>
          <div className="text-sm text-white/60">
            {t("onboarding.plan.gainedPrefix")}
            {plan.gained} {t("onboarding.plan.gainedSuffix")}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 text-center">
          <Lock className="h-4 w-4 text-white/70" />
          <div className="text-sm font-medium text-white/90">{t("onboarding.plan.lockedTitle")}</div>
          <div className="text-[11px] text-white/50">{t("onboarding.plan.lockedSub")}</div>
        </div>
      </div>

      <TimeSpendList plan={plan} />
      <TimeRiskList />

      <p className="mt-4 text-[11px] leading-relaxed text-white/40">
        {t("onboarding.plan.footnote")}
      </p>

      <div className="mt-auto space-y-3 pt-8">
        <Link
          to="/auth"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-medium text-black transition-transform hover:-translate-y-0.5"
        >
          {t("onboarding.plan.startJourney")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** Compact duration using the active language's unit letters ("4a 2m" / "4y 2m"). */
function fmtMonths(m: number, yr: string, mo: string) {
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y === 0) return `${r}${mo}`;
  return r === 0 ? `${y}${yr}` : `${y}${yr} ${r}${mo}`;
}

function TimeSpendList({ plan }: { plan: PlanData }) {
  const { t } = useI18n();
  const yr = t("common.yearShort");
  const mo = t("common.monthShort");
  const items = [
    {
      icon: Palmtree,
      label: t("onboarding.plan.spend.sabbaticalLabel"),
      months: 12,
      hint: t("onboarding.plan.spend.sabbaticalHint"),
    },
    {
      icon: Plane,
      label: t("onboarding.plan.spend.worldLabel"),
      months: 6,
      hint: t("onboarding.plan.spend.worldHint"),
    },
    {
      icon: GraduationCap,
      label: t("onboarding.plan.spend.reskillLabel"),
      months: 4,
      hint: t("onboarding.plan.spend.reskillHint"),
    },
    {
      icon: Home,
      label: t("onboarding.plan.spend.ownProjectLabel"),
      months: 18,
      hint: t("onboarding.plan.spend.ownProjectHint"),
    },
  ];
  const budget = plan.yearsNow * 12 + plan.monthsNow;
  return (
    <div className="mt-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        {t("onboarding.plan.spendHeading")} {fmtMonths(budget, yr, mo)}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((it, idx) => {
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
                      <span className="logo-gradient-text inline-block">
                        −{fmtMonths(it.months, yr, mo)}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/40">
                      {affordable
                        ? `${pct}% ${t("onboarding.plan.ofBudget")}`
                        : t("onboarding.plan.outOfReach")}
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
                  <span className="text-[11px] text-white/70">
                    {t("onboarding.plan.unlockShort")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeRiskList() {
  const { t } = useI18n();
  const yr = t("common.yearShort");
  const mo = t("common.monthShort");
  const items = [
    {
      icon: CreditCard,
      label: t("onboarding.plan.risk.creepLabel"),
      hint: t("onboarding.plan.risk.creepHint"),
      months: 30,
      locked: false,
    },
    {
      icon: TrendingDown,
      label: t("onboarding.plan.risk.liquidLabel"),
      hint: t("onboarding.plan.risk.liquidHint"),
      months: 20,
      locked: false,
    },
    {
      icon: AlertTriangle,
      label: t("onboarding.plan.risk.emergencyLabel"),
      hint: t("onboarding.plan.risk.emergencyHint"),
      months: 36,
      locked: true,
    },
  ];
  return (
    <div className="mt-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        {t("onboarding.plan.riskHeading")}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((it) => {
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
                  <div className="font-display text-sm text-white/80">−{fmtMonths(it.months, yr, mo)}</div>
                </div>
              </div>
              {it.locked && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20 text-center">
                  <Lock className="h-3.5 w-3.5 text-white/70" />
                  <span className="text-[11px] text-white/70">
                    {t("onboarding.plan.unlockShort")}
                  </span>
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
  const { t } = useI18n();
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
        <span>{t("onboarding.plan.chartToday")}</span>
        <span>{t("onboarding.plan.chart5")}</span>
        <span>{t("onboarding.plan.chart10")}</span>
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
