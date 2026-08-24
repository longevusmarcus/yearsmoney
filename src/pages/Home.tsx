import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, TrendingUp, TrendingDown, Landmark, CreditCard, Coins, Building2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import AuthModal from "@/components/AuthModal";
import MobileOnly from "@/components/MobileOnly";
import { useMsx } from "@/msx/MsxBootGate";

import { useUserFinances } from "@/hooks/useUserFinances";
import { useI18n } from "@/i18n/I18nProvider";
import { ComposedChart, Area, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Scenario {
  title: string;
  lever?: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  yearsToGoal: number;
  description: string;
}


/** Minimal markdown renderer: **bold**, *italic* and `code`. */
function renderRichText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^\*[^*\n]+\*$/.test(part)) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const Home = () => {
  const { t, lang } = useI18n();
  // Use the synced finances hook
  const { finances, updateFinances, isLoading: financesLoading, isSyncing, user } = useUserFinances();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isMsx, entitled: msxEntitled } = useMsx();
  // Inside MSX the user is already authenticated via the launch bootstrap.
  // Never show the in-app sign-in modal in that context.
  const suppressAuth = isMsx || msxEntitled;

  // UI state
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'years' | 'months' | 'days'>('years');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [firstName, setFirstName] = useState<string>("");

  // Freedom goal + AI scenarios
  const [goalYears, setGoalYears] = useState<string>(() => localStorage.getItem("tc_goal_years") ?? "");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [scenariosError, setScenariosError] = useState<string | null>(null);


  // Load the user's name for the advisor greeting
  useEffect(() => {
    if (!user) {
      setFirstName("");
      return;
    }
    let cancelled = false;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("profiles")
        .select("first_name, nickname")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName =
        typeof meta.full_name === "string"
          ? meta.full_name.split(" ")[0]
          : typeof meta.name === "string"
          ? meta.name.split(" ")[0]
          : "";
      setFirstName(data?.first_name || data?.nickname || metaName || "");
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);


  // Handle input focus - show auth modal if not logged in (skip in MSX shell)
  const handleInputFocus = () => {
    if (!user && !suppressAuth) {
      setShowAuthModal(true);
    }
  };

  // Calculations
  const { monthlyIncome, monthlyExpenses, netWorth } = finances;
  const freeCash = monthlyIncome - monthlyExpenses;
  const isNegative = freeCash < 0;

  // Monthly savings rate
  const monthlySavings = Math.max(0, freeCash);

  // Life buffer WITHOUT income (only net worth / expenses) - current runway
  const lifeBufferWithoutIncome = monthlyExpenses > 0 
    ? netWorth / monthlyExpenses 
    : 0;

  // Projection WITH the current cash flow. When income is lower than expenses
  // the buffer still shrinks — just more slowly than with no income at all.
  const calculateProjectionWithIncome = (years: number) => {
    if (monthlyExpenses <= 0) return 0;
    const futureNetWorth = Math.max(0, netWorth + freeCash * years * 12);
    return futureNetWorth / monthlyExpenses;
  };

  // Projection with ZERO income: net worth burns at the full expense rate.
  const calculateProjectionNoIncome = (years: number) => {
    if (monthlyExpenses <= 0) return 0;
    const futureNetWorth = Math.max(0, netWorth - monthlyExpenses * years * 12);
    return futureNetWorth / monthlyExpenses;
  };

  // Runway in months: with the current (possibly partial) income vs no income
  const runwayWithPartialIncome =
    freeCash >= 0 ? Infinity : netWorth / Math.abs(freeCash);
  const runwayNoIncome = lifeBufferWithoutIncome;

  // Monthly buffer gain in months
  const monthlyBufferGain = monthlyExpenses > 0 ? monthlySavings / monthlyExpenses : 0;

  const projectionData = [
    { 
      label: t("app.home.axisNow"), 
      withIncome: Math.round(lifeBufferWithoutIncome),
      withoutIncome: Math.round(lifeBufferWithoutIncome),
    },
    { 
      label: t("app.home.axis1y"), 
      withIncome: Math.round(calculateProjectionWithIncome(1)),
      withoutIncome: Math.round(calculateProjectionNoIncome(1)),
    },
    { 
      label: t("app.home.axis5y"), 
      withIncome: Math.round(calculateProjectionWithIncome(5)),
      withoutIncome: Math.round(calculateProjectionNoIncome(5)),
    },
    { 
      label: t("app.home.axis20y"), 
      withIncome: Math.round(calculateProjectionWithIncome(20)),
      withoutIncome: Math.round(calculateProjectionNoIncome(20)),
    },
  ];


  // Format display based on mode
  const formatLifeBuffer = (months: number) => {
    if (displayMode === 'days') {
      const days = Math.round(months * 30);
      return `${days.toLocaleString()}${t("app.home.dayShort")}`;
    } else if (displayMode === 'months') {
      return `${Math.round(months)}${t("app.home.monthAbbr")}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = Math.round(months % 12);
      if (years > 0 && remainingMonths > 0) {
        return `${years}${t("common.yearShort")} ${remainingMonths}${t("common.monthShort")}`;
      } else if (years > 0) {
        return `${years} ${t("app.home.unitYears")}`;
      } else {
        return `${remainingMonths} ${t("app.home.unitMonths")}`;
      }
    }
  };

  const cycleDisplayMode = () => {
    setDisplayMode(prev => prev === 'years' ? 'months' : prev === 'months' ? 'days' : 'years');
  };

  // ---- Freedom goal scenarios (AI) ----
  const canGenerateScenarios = monthlyIncome > 0 && monthlyExpenses > 0;

  const generateScenarios = async () => {
    if (!canGenerateScenarios) return;
    setScenariosLoading(true);
    setScenariosError(null);

    const attempt = async (): Promise<Scenario[]> => {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "scenarios",
          lang,
          income: monthlyIncome,
          expenses: monthlyExpenses,
          netWorth,
          goalYears: Number(goalYears) || 10,
          seed: Math.random().toString(36).slice(2),
        }),
      });
      if (!response.ok) throw new Error(`scenarios failed: ${response.status}`);
      const data = await response.json();
      const list: Scenario[] = Array.isArray(data?.scenarios) ? data.scenarios : [];
      if (list.length === 0) throw new Error("empty");
      return list;
    };

    try {
      let list: Scenario[];
      try {
        list = await attempt();
      } catch (first) {
        console.warn("scenarios retry after:", first);
        await new Promise((r) => setTimeout(r, 1200));
        list = await attempt();
      }
      setScenarios(list);
    } catch (e) {
      console.error("scenarios error:", e);
      setScenariosError(t("app.home.goalError"));
    } finally {
      setScenariosLoading(false);
    }
  };


  const applyScenario = (s: Scenario) => {
    updateFinances({
      monthlyIncome: Math.round(s.monthlyIncome),
      monthlyExpenses: Math.round(s.monthlyExpenses),
      netWorth: Math.round(s.netWorth),
    });
  };

  // ---- Life milestones ----
  const yearlyExpenses = monthlyExpenses * 12;
  const milestones = [
    { key: "milestoneSabbatical", cost: yearlyExpenses },
    { key: "milestoneHouse", cost: yearlyExpenses * 2 },
    { key: "milestoneTrip", cost: monthlyExpenses * 8 },
    { key: "milestoneCar", cost: monthlyExpenses * 6 },
    { key: "milestoneFreedom", cost: yearlyExpenses * 25 },
  ].map((m) => {
    const costInYears = yearlyExpenses > 0 ? m.cost / yearlyExpenses : 0;
    const missing = Math.max(0, m.cost - netWorth);
    const monthsToReach =
      missing === 0 ? 0 : monthlySavings > 0 ? Math.ceil(missing / monthlySavings) : null;
    return { ...m, costInYears, monthsToReach };
  });


  // Hours gained/lost this month
  const hoursGainedOrLost = freeCash > 0 && monthlyExpenses > 0
    ? Math.round((freeCash / monthlyExpenses) * 30 * 24)
    : freeCash < 0 && monthlyExpenses > 0
    ? Math.round((freeCash / monthlyExpenses) * 30 * 24)
    : 0;

  // Chat scroll
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const context = `User's financial context:
- Monthly Income: $${monthlyIncome}
- Monthly Expenses: $${monthlyExpenses}
- Net Worth: $${netWorth}
- Free Cash: $${freeCash}/month
- Current optional life (runway): ${formatLifeBuffer(lifeBufferWithoutIncome)}
- In 1 year: ${formatLifeBuffer(calculateProjectionWithIncome(1))}
- In 5 years: ${formatLifeBuffer(calculateProjectionWithIncome(5))}
- In 20 years: ${formatLifeBuffer(calculateProjectionWithIncome(20))}
- Hours ${hoursGainedOrLost >= 0 ? 'gained' : 'lost'} this month: ${Math.abs(hoursGainedOrLost)} hours`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            type: "chat",
            lang,
            context
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
            }
          } catch (e) {
            console.error("Error parsing:", e);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileOnly>
    <div className="min-h-screen bg-transparent pb-24">
      {/* Header */}
      <PageHeader title="Years">
        <h1 className="text-2xl text-foreground tracking-tight">
          <span className="font-light">{t("app.home.welcome")} </span>
          <span className="font-cursive italic">Years</span>
        </h1>
      </PageHeader>

      {/* Input Fields */}
      <div className="px-6 mb-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.home.incomeMo")}</label>
            <input
              type="number"
              value={monthlyIncome || ""}
              onChange={(e) => updateFinances({ monthlyIncome: Number(e.target.value) })}
              onFocus={handleInputFocus}
              placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.home.costsMo")}</label>
            <input
              type="number"
              value={monthlyExpenses || ""}
              onChange={(e) => updateFinances({ monthlyExpenses: Number(e.target.value) })}
              onFocus={handleInputFocus}
              placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.home.netWorth")}</label>
            <input
              type="number"
              value={netWorth || ""}
              onChange={(e) => updateFinances({ netWorth: Number(e.target.value) })}
              onFocus={handleInputFocus}
              placeholder="0"
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>
        </div>

        {/* Freedom goal + AI scenarios */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            {t("app.home.goalTitle")}
          </h2>
          <label className="text-[10px] text-muted-foreground font-light" htmlFor="goal-years">
            {t("app.home.goalLabel")}
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="goal-years"
              type="number"
              min={1}
              value={goalYears}
              onChange={(e) => {
                setGoalYears(e.target.value);
                localStorage.setItem("tc_goal_years", e.target.value);
              }}
              placeholder={t("app.home.goalPlaceholder")}
              className="w-24 bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
            <button
              onClick={generateScenarios}
              disabled={scenariosLoading || !canGenerateScenarios}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-light text-foreground transition-colors hover:bg-muted/50 disabled:opacity-40"
            >
              {scenariosLoading
                ? t("app.home.goalLoading")
                : scenarios.length > 0
                ? t("app.home.goalRefresh")
                : t("app.home.goalGenerate")}
            </button>
          </div>

          {!canGenerateScenarios && (
            <p className="mt-2 text-[11px] font-light text-muted-foreground">{t("app.home.goalNeedData")}</p>
          )}
          {scenariosError && (
            <p className="mt-2 text-[11px] font-light text-destructive">{scenariosError}</p>
          )}

          {scenarios.length > 0 && (
            <div className="mt-4 space-y-3">
              {scenarios.map((s, i) => (
                <div key={i} className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-light text-foreground">{s.title}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("app.home.scenarioReach")} {Math.round(s.yearsToGoal)} {t("app.home.goalYears")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-light text-muted-foreground">{renderRichText(s.description)}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: t("app.home.scenarioIncome"), value: s.monthlyIncome },
                      { label: t("app.home.scenarioExpenses"), value: s.monthlyExpenses },
                      { label: t("app.home.scenarioNetWorth"), value: s.netWorth },
                    ].map((cell) => (
                      <div key={cell.label}>
                        <p className="text-sm font-light text-foreground">
                          {Math.round(cell.value).toLocaleString()}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{cell.label}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => applyScenario(s)}
                    className="mt-3 w-full rounded-lg border border-border px-3 py-1.5 text-[11px] font-light text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {t("app.home.scenarioApply")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Connect Accounts - Coming Soon */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("app.home.syncAccounts")}</h2>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">{t("app.home.soon")}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Building2, label: "Schwab" },
            { icon: CreditCard, label: "Stripe" },
            { icon: Landmark, label: t("app.home.bank") },
            { icon: Coins, label: "Crypto" },
          ].map((item, idx) => (
            <button
              key={idx}
              disabled
              className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-card/30 opacity-40 cursor-not-allowed transition-opacity"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground font-light">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Life Buffer Cards - Both scenarios */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Without Income */}
          <button
            onClick={cycleDisplayMode}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-foreground/20 transition-colors active:scale-[0.98] duration-150"
          >
            <div className="flex items-center gap-1 mb-2">
              <TrendingDown className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("app.home.ifYouStop")}</span>
            </div>
            <p 
              key={displayMode + '-without'}
              className="logo-gradient-text inline-block font-display text-3xl tracking-tight animate-fade-in"
            >
              {formatLifeBuffer(lifeBufferWithoutIncome)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground font-light">{t("app.home.runwayNow")}</p>
              <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">{displayMode}</span>
            </div>
          </button>

          {/* With Income - 1 year projection */}
          <button
            onClick={cycleDisplayMode}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-foreground/20 transition-colors active:scale-[0.98] duration-150"
          >
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{t("app.home.keepEarning")}</span>
            </div>
            <p 
              key={displayMode + '-with'}
              className="logo-gradient-text inline-block font-display text-3xl tracking-tight animate-fade-in"
            >
              {formatLifeBuffer(calculateProjectionWithIncome(1))}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground font-light">{t("app.home.inOneYear")}</p>
              <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">{displayMode}</span>
            </div>
          </button>
        </div>

        {/* Hours Gained/Lost */}
        <div className={`mt-3 rounded-2xl p-4 border ${
          isNegative 
            ? 'bg-destructive/10 border-destructive/20' 
            : 'bg-card border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-light">{t("app.home.gainedThisMonth")}</span>
            <span className={`text-xl font-light ${isNegative ? 'text-destructive' : 'text-foreground'}`}>
              {isNegative ? '' : '+'}{hoursGainedOrLost.toLocaleString()} {t("app.home.hours")}
            </span>
          </div>
          {isNegative && (
            <p className="text-xs text-destructive/80 font-light mt-1">
              {t("app.home.tradingFuture")}
            </p>
          )}
        </div>

        {/* Partial income still stretches the runway */}
        {isNegative && monthlyIncome > 0 && monthlyExpenses > 0 && netWorth > 0 && (
          <div className="mt-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-light text-muted-foreground">{t("app.home.burnTitle")}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="logo-gradient-text inline-block font-display text-2xl tracking-tight">
                  {formatLifeBuffer(runwayWithPartialIncome)}
                </p>
                <p className="text-[10px] font-light text-muted-foreground">{t("app.home.burnWithIncome")}</p>
              </div>
              <div>
                <p className="font-display text-2xl tracking-tight text-muted-foreground">
                  {formatLifeBuffer(runwayNoIncome)}
                </p>
                <p className="text-[10px] font-light text-muted-foreground">{t("app.home.burnNoIncome")}</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] font-light text-muted-foreground/80">{t("app.home.burnHint")}</p>
          </div>
        )}
      </div>


      {/* Projection Chart */}
      <div className="px-6 mb-6">
        <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">{t("app.home.futureProjection")}</h2>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projectionData}>
                {/* Same gradient ramp as the onboarding plan chart: warm fill fading
                    into violet, violet-to-gold stroke */}
                <defs>
                  <linearGradient id="homeFreedomFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 55)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="oklch(0.55 0.24 295)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="homeFreedomLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="oklch(0.55 0.24 295)" />
                    <stop offset="100%" stopColor="oklch(0.78 0.17 60)" />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number, name: string) => [
                    formatLifeBuffer(value), 
                    name === 'withIncome' ? t("app.home.withIncome") : t("app.home.withoutIncome")
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="withIncome"
                  stroke="url(#homeFreedomLine)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="url(#homeFreedomFill)"
                  dot={false}
                  activeDot={{ r: 3, fill: 'hsl(var(--foreground))', strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="withoutIncome"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 2, fill: 'hsl(var(--muted-foreground))', strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-foreground rounded-full" />
              <span className="text-[10px] text-muted-foreground">{t("app.home.keepEarning")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-muted-foreground rounded-full opacity-60" />
              <span className="text-[10px] text-muted-foreground">{t("app.home.withoutIncome")}</span>
            </div>
          </div>

          {/* Projection Values */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {projectionData.map((item, idx) => (
              <div key={idx} className="text-center">
                <p className="text-sm font-light text-foreground">
                  {formatLifeBuffer(item.withIncome)}
                </p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Life milestones */}
      {monthlyExpenses > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            {t("app.home.milestonesTitle")}
          </h2>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border/60">
            {milestones.map((m) => (
              <div key={m.key} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-light text-foreground">{t(`app.home.${m.key}`)}</p>
                  <p className="text-[10px] font-light text-muted-foreground">
                    {m.costInYears < 1
                      ? `${Math.round(m.costInYears * 12)} ${t("app.home.unitMonths")}`
                      : `${m.costInYears.toFixed(m.costInYears < 3 ? 1 : 0)} ${t("app.home.unitYears")}`}{" "}
                    · {t("app.home.milestoneCost")}
                  </p>
                </div>
                <div className="text-right">
                  {m.monthsToReach === 0 ? (
                    <p className="logo-gradient-text inline-block text-sm">{t("app.home.milestoneNow")}</p>
                  ) : m.monthsToReach === null ? (
                    <p className="text-sm font-light text-muted-foreground">{t("app.home.milestoneNever")}</p>
                  ) : (
                    <>
                      <p className="text-sm font-light text-foreground">{formatLifeBuffer(m.monthsToReach)}</p>
                      <p className="text-[10px] font-light text-muted-foreground">{t("app.home.milestoneReach")}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Insight */}
      {monthlyExpenses > 0 && monthlySavings > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-light text-foreground">
                  {t("app.home.insightSavePre")} ${monthlySavings.toLocaleString()}, {t("app.home.insightSaveMid")}{" "}
                  <span className="font-medium">
                    {Math.round((monthlySavings / monthlyExpenses) * 30 * 24).toLocaleString()} {t("app.home.hours")}
                  </span>{" "}
                  {t("app.home.insightSaveSuffix")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Chat Button */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-2xl">
          {/* Ambient blooms, so the panel sits on the same field as the rest of the app */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-[-10%] h-[420px] w-[420px] rounded-full bg-[oklch(0.72_0.19_55/0.18)] blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-15%] h-[480px] w-[480px] rounded-full bg-[oklch(0.55_0.24_295/0.18)] blur-[140px]" />
          </div>

          <div className="mx-auto flex h-full w-full max-w-[560px] flex-col">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-display text-lg">{t("app.home.advisorTitle")}</h2>
              <button
                onClick={() => setShowChat(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <p className="font-display text-xl">
                    {firstName
                      ? t("app.home.advisorGreeting").replace("{name}", firstName)
                      : t("app.home.advisorGreetingAnon")}
                  </p>
                  <p className="mt-2 font-light text-muted-foreground">{t("app.home.advisorEmpty")}</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === "user" ? "text-right" : "text-left"}>
                  <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-white to-white/80 text-black"
                      : "border border-border bg-card text-foreground backdrop-blur-xl"
                  }`}>
                    <p className="text-sm font-light whitespace-pre-wrap text-left">
                      {renderRichText(msg.content)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left">
                  <div className="inline-block rounded-2xl border border-border bg-card px-4 py-2 backdrop-blur-xl">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder={t("app.home.advisorPlaceholder")}
                className="flex-1 rounded-full border border-border bg-input px-4 py-2.5 text-sm font-light backdrop-blur-md placeholder:text-muted-foreground focus:border-white/25 focus:outline-none"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.72_0.19_310)] to-[oklch(0.85_0.19_90)] text-black transition-transform hover:scale-105 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}


      <BottomNav />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
    </MobileOnly>
  );
};

export default Home;
