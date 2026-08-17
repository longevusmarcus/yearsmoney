import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sun,
  Settings,
  ExternalLink,
  Car,
  CornerDownRight,
  TrendingUp,
  TrendingDown,
  Building2,
  CreditCard,
  Landmark,
  Bitcoin,
  MessageCircle,
  Target,
  Plane,
  Home,
  GraduationCap,
  Trophy,
} from "lucide-react";
import carRed from "@/assets/car-red.jpg";
import carGrey from "@/assets/car-grey.jpg";
import { useI18n } from "@/i18n/I18nProvider";

/* ---------- screens rendered with the site's own UI language ---------- */

function ScreenShell({
  title,
  sub,
  children,
}: {
  title: React.ReactNode;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    // Same ground as the real app screens: pure black with the ambient blooms,
    // scaled down to the phone viewport (see components/AppBackground.tsx).
    <div className="relative flex h-full flex-col bg-black text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 left-[-15%] h-48 w-48 rounded-full bg-[oklch(0.72_0.19_55/0.20)] blur-[55px]" />
        <div className="absolute top-1/2 right-[-20%] h-56 w-56 rounded-full bg-[oklch(0.55_0.24_295/0.20)] blur-[65px]" />
        <div className="absolute bottom-[-8%] left-1/4 h-40 w-40 rounded-full bg-[oklch(0.70_0.16_180/0.14)] blur-[55px]" />
      </div>
      <div className="relative flex items-start justify-between px-4 pt-12">
        <div>
          <h4 className="whitespace-nowrap font-grotesk text-[17px] font-bold leading-tight tracking-tight">
            {title}
          </h4>
          {sub ? <p className="mt-0.5 text-[9px] text-white/45">{sub}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1 text-white/45">
          <Sun className="h-3 w-3" />
          <Settings className="h-3 w-3" />
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-4 pb-4 pt-3">
        {children}
      </div>
    </div>
  );
}

function Tile({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function BufferScreen() {
  const { t } = useI18n();
  return (
    <ScreenShell
      title={
        <>
          {t("showcase.buffer.welcome")} <span className="font-cormorant italic">Years</span>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        {[
          [t("showcase.buffer.incomeMo"), "5000"],
          [t("showcase.buffer.costsMo"), "3800"],
          [t("showcase.buffer.netWorth"), "300000"],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <p className="mb-1 truncate text-[7px] uppercase tracking-[0.14em] text-white/35">{k}</p>
            <div className="truncate rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-[11px] font-medium">
              {v}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[7px] uppercase tracking-[0.14em] text-white/35">{t("showcase.buffer.linkAccounts")}</p>
          <span className="text-[7px] uppercase tracking-[0.14em] text-white/25">{t("showcase.buffer.soon")}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            ["Schwab", Building2],
            ["Stripe", CreditCard],
            [t("showcase.buffer.bank"), Landmark],
            ["Crypto", Bitcoin],
          ].map(([s, Ico]) => {
            const I = Ico as typeof Building2;
            return (
              <div
                key={s as string}
                className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] px-1 py-2 text-center text-[7px] text-white/35"
              >
                <I className="h-3 w-3" />
                {s as string}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Tile className="min-w-0 p-2.5">
          <p className="flex items-center gap-1 truncate text-[7px] uppercase tracking-[0.14em] text-white/35">
            <TrendingDown className="h-2.5 w-2.5 shrink-0" /> {t("showcase.buffer.ifYouStop")}
          </p>
          <p className="mt-1.5 truncate font-grotesk text-xl font-bold tracking-tight">
            {t("showcase.buffer.ifYouStopValue")}
          </p>
          <div className="mt-1.5 flex items-end justify-between">
            <span className="text-[8px] text-white/40">{t("showcase.buffer.now")}</span>
            <span className="text-[7px] uppercase tracking-widest text-white/25">YEARS</span>
          </div>
        </Tile>
        <Tile className="min-w-0 p-2.5">
          <p className="flex items-center gap-1 truncate text-[7px] uppercase tracking-[0.14em] text-white/35">
            <TrendingUp className="h-2.5 w-2.5 shrink-0" /> {t("showcase.buffer.keepGoing")}
          </p>
          <p className="mt-1.5 truncate font-grotesk text-xl font-bold tracking-tight">
            {t("showcase.buffer.keepGoingValue")}
          </p>
          <div className="mt-1.5 flex items-end justify-between">
            <span className="text-[8px] text-white/40">{t("showcase.buffer.inOneYear")}</span>
            <span className="text-[7px] uppercase tracking-widest text-white/25">YEARS</span>
          </div>
        </Tile>
      </div>

      <Tile className="flex min-w-0 shrink-0 items-center justify-between gap-2 p-2.5">
        <span className="truncate text-[9px] text-white/60">{t("showcase.buffer.gainedThisMonth")}</span>
        <span className="shrink-0 whitespace-nowrap font-grotesk text-[13px] font-semibold">
          {t("showcase.buffer.gainedHours")}
        </span>
      </Tile>

      <div className="flex shrink-0 flex-col">
        <p className="mb-1.5 text-[7px] uppercase tracking-[0.14em] text-white/35">
          {t("showcase.buffer.projection")}
        </p>
        <Tile className="relative flex h-[92px] flex-col p-3">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="min-h-0 w-full flex-1">
            <path
              d="M2 34 L26 33 L50 30 L74 22 L98 8"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M2 34 L98 34"
              fill="none"
              stroke="white"
              strokeOpacity="0.2"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
            {[
              [2, 34],
              [26, 33],
              [50, 30],
              [74, 22],
              [98, 8],
            ].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="1.4" fill="white" />
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-[7px] text-white/30">
            <span>{t("showcase.buffer.axis1y")}</span>
            <span>{t("showcase.buffer.axis5y")}</span>
            <span>{t("showcase.buffer.axis20y")}</span>
          </div>
          <span className="absolute -bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-white text-black">
            <MessageCircle className="h-3.5 w-3.5" />
          </span>
        </Tile>
      </div>
    </ScreenShell>
  );
}

function GoalsScreen() {
  const { t } = useI18n();
  const goals: [string, string, number][] = [
    [t("showcase.goals.sabbatical"), `${t("showcase.goals.inTime")} ${t("showcase.goals.sabbaticalEta")}`, 72],
    [t("showcase.goals.houseDeposit"), `${t("showcase.goals.inTime")} ${t("showcase.goals.houseEta")}`, 41],
    [t("showcase.goals.masters"), `${t("showcase.goals.inTime")} ${t("showcase.goals.mastersEta")}`, 58],
  ];
  const icons = [Plane, Home, GraduationCap];
  return (
    <ScreenShell title={t("showcase.goals.label")} sub={t("showcase.goals.title")}>
      <div className="grid grid-cols-2 gap-2">
        <Tile className="min-w-0 p-2.5">
          <p className="truncate text-[7px] uppercase tracking-[0.14em] text-white/35">{t("showcase.goals.today")}</p>
          <p className="mt-1.5 truncate font-grotesk text-xl font-bold tracking-tight">
            {t("showcase.goals.todayValue")}
          </p>
          <p className="mt-1 text-[8px] text-white/40">{t("showcase.goals.ofFreedom")}</p>
        </Tile>
        <Tile className="min-w-0 p-2.5">
          <p className="flex items-center gap-1 truncate text-[7px] uppercase tracking-[0.14em] text-white/35">
            <Target className="h-2.5 w-2.5 shrink-0" /> {t("showcase.goals.scenario")}
          </p>
          <p className="mt-1.5 truncate font-grotesk text-xl font-bold tracking-tight text-[oklch(0.75_0.19_150)]">
            {t("showcase.goals.scenarioValue")}
          </p>
          <p className="mt-1 text-[8px] text-white/40">{t("showcase.goals.inFiveYears")}</p>
        </Tile>
      </div>

      <div className="flex shrink-0 flex-col">
        <p className="mb-1.5 text-[7px] uppercase tracking-[0.14em] text-white/35">
          {t("showcase.goals.simulation")}
        </p>
        <Tile className="flex h-[86px] flex-col p-3">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="min-h-0 w-full flex-1">
            <path
              d="M2 34 L26 30 L50 24 L74 15 L98 4"
              fill="none"
              stroke="oklch(0.75 0.19 150)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M2 34 L26 33 L50 31 L74 27 L98 22"
              fill="none"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          </svg>
          <div className="mt-1 flex justify-between text-[7px] text-white/30">
            <span>{t("showcase.goals.axisToday")}</span>
            <span>{t("showcase.goals.axis5y")}</span>
            <span>{t("showcase.goals.axis10y")}</span>
          </div>
        </Tile>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-[7px] uppercase tracking-[0.14em] text-white/35">{t("showcase.goals.yourGoals")}</p>
        {goals.map(([name, eta, pct], i) => {
          const I = icons[i];
          return (
            <Tile key={name} className="min-w-0 p-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10">
                  <I className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px] text-white/80">{name}</span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[8px] text-white/35">
                <span>{pct}% {t("showcase.goals.reached")}</span>
                <span>{eta}</span>
              </div>
            </Tile>
          );
        })}
      </div>
    </ScreenShell>
  );
}

function PurchaseScreen() {
  const { t } = useI18n();
  return (
    <ScreenShell title={t("showcase.purchase.label")} sub={t("showcase.purchase.sub")}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[8px] text-white/70">
          <Car className="h-2.5 w-2.5" /> {t("showcase.purchase.car")}
        </span>
        <span className="truncate text-[8px] text-white/35">{t("showcase.purchase.via")}</span>
      </div>
      <p className="flex min-w-0 items-center gap-1 text-[8px] uppercase tracking-[0.12em] text-white/35">
        <CornerDownRight className="h-2.5 w-2.5 shrink-0" /> {t("showcase.purchase.listingsFound")}
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <Tile className="shrink-0 overflow-hidden p-0">
          <div className="relative h-[110px]">
            <img
              src={carRed}
              alt={t("showcase.purchase.carName")}
              loading="lazy"
              width={1024}
              height={576}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-2 py-1 text-[7px] text-white/80">
              {t("showcase.purchase.mostExpensive")}
            </span>
            <span className="absolute right-2.5 top-2.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold">
              $94,990
            </span>
          </div>
          <div className="p-3.5">
            <p className="text-[12px] font-semibold">{t("showcase.purchase.carName")}</p>
            <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/45">
              {t("showcase.purchase.carDesc")}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <span className="font-grotesk text-[22px] font-bold tracking-tight">1741.5</span>
                <span className="ml-1 text-[10px] text-white/50">{t("showcase.purchase.days")}</span>
                <p className="text-[8px] text-white/35">{t("showcase.purchase.toBreakEven")}</p>
              </div>
              <div className="text-right">
                <span className="text-[12px] font-semibold text-[oklch(0.65_0.2_25)]">−31.7%</span>
                <p className="text-[8px] text-white/35">{t("showcase.purchase.ofBuffer")}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-2.5 text-[8px] text-white/45">
              <span>{t("showcase.purchase.source")}</span>
              <span className="inline-flex items-center gap-1 text-white/70">
                {t("showcase.purchase.viewListing")} <ExternalLink className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </Tile>
        <Tile className="shrink-0 overflow-hidden p-0">
          <div className="relative h-[110px]">
            <img
              src={carGrey}
              alt={t("showcase.purchase.greyCarAlt")}
              loading="lazy"
              width={1024}
              height={576}
              className="h-full w-full object-cover"
            />
            <span className="absolute right-2.5 top-2.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold">
              $79,990
            </span>
          </div>
        </Tile>
      </div>
    </ScreenShell>
  );
}

function RisksScreen() {
  const { t } = useI18n();
  return (
    <ScreenShell title={t("showcase.risks.label")} sub={t("showcase.risks.sub")}>
      <div>
        <p className="font-grotesk text-[18px] font-bold tracking-tight">Bitcoin</p>
        <p className="text-[10px] text-white/40">{t("showcase.risks.invested")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Tile className="p-3">
          <p className="text-[8px] text-white/40">{t("showcase.risks.ifUp")}</p>
          <p className="mt-1 font-grotesk text-xl font-bold tracking-tight text-[oklch(0.75_0.19_150)]">
            +8053
          </p>
          <p className="text-[8px] text-white/35">{t("showcase.risks.hoursGained")}</p>
        </Tile>
        <Tile className="p-3">
          <p className="text-[8px] text-white/40">{t("showcase.risks.ifDown")}</p>
          <p className="mt-1 font-grotesk text-xl font-bold tracking-tight text-[oklch(0.65_0.2_25)]">
            −5211
          </p>
          <p className="text-[8px] text-white/35">{t("showcase.risks.hoursLost")}</p>
        </Tile>
      </div>

      <p className="text-[9px] text-white/40">{t("showcase.risks.ifItFails")}</p>
      <div className="space-y-2">
        {[
          [t("showcase.risks.helpParents"), t("showcase.risks.helpParentsValue")],
          [t("showcase.risks.buildSomething"), t("showcase.risks.buildSomethingValue")],
          [t("showcase.risks.familyHolidays"), t("showcase.risks.familyHolidaysValue")],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px]"
          >
            <span className="text-white/55">{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="font-grotesk text-4xl font-bold tracking-tight text-[oklch(0.65_0.2_25)]">
          0.59
        </span>
        <span className="mt-1 text-[9px] text-white/40">{t("showcase.risks.yearsAtRisk")}</span>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.07] pt-2.5 text-[10px]">
        <span className="text-white/55">{t("showcase.risks.volatility")}</span>
        <span className="font-semibold text-[oklch(0.65_0.2_25)]">{t("showcase.risks.high")}</span>
      </div>
    </ScreenShell>
  );
}

function LeaderboardScreen() {
  const { t } = useI18n();
  const rows: [string, string, string, string][] = [
    ["1", "Mar…", "4.2", "10.4"],
    ["2", "Sof…", "4.0", "5.3"],
    ["3", "Ais…", "3.7", "8.3"],
    ["4", "Jam…", "3.7", "8.2"],
    ["5", "Luc…", "3.4", "4.3"],
    ["6", "Dav…", "3.3", "8.7"],
    ["7", "Emm…", "3.1", "4.8"],
    ["8", "Oli…", "3.0", "3.5"],
  ];
  return (
    <ScreenShell title={t("showcase.leaderboard.label")} sub={t("showcase.leaderboard.sub")}>
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        {rows.map(([pos, name, val, alt], i) => (
          <div
            key={pos}
            className="flex items-center gap-3 border-b border-white/[0.06] py-2 last:border-0"
          >
            <span className="w-3 text-[10px] text-white/35">{pos}</span>
            {i < 3 ? <Trophy className="h-3 w-3 text-white/45" /> : <span className="h-3 w-3" />}
            <span className="flex-1 text-[11px] text-white/80">{name}</span>
            <span className="font-grotesk text-[15px] font-bold tracking-tight">{val}</span>
            <span className="text-[8px] text-white/30">a /{alt}a</span>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

const SCREEN_KEYS = [
  { key: "buffer", render: BufferScreen },
  { key: "goals", render: GoalsScreen },
  { key: "purchase", render: PurchaseScreen },
  { key: "risks", render: RisksScreen },
  { key: "leaderboard", render: LeaderboardScreen },
] as const;

export function IphoneShowcase() {
  const { t } = useI18n();
  const SCREENS = SCREEN_KEYS.map(({ key, render }) => ({
    label: t(`showcase.${key}.label`),
    title: t(`showcase.${key}.title`),
    desc: t(`showcase.${key}.desc`),
    render,
  }));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(Math.max(-rect.top / total, 0), 0.999);
      setActive(Math.floor(progress * SCREEN_KEYS.length));

      const mobile = window.innerWidth < 768;
      const startScale = mobile ? 0.78 : 1.0;
      const endScale = mobile ? 0.7 : 0.72;
      const s = startScale - (startScale - endScale) * progress;
      if (phoneRef.current) {
        phoneRef.current.style.transform = `translate(-50%, -50%) scale(${s})`;
      }
    };
    // Coalesce to one measurement per frame; this handler reads layout and
    // writes a transform, which is expensive to run on every raw scroll event.
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        onScroll();
      });
    };

    onScroll();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const current = SCREENS[active] ?? SCREENS[0];
  const Screen = current.render;

  return (
    <section id="scopri" className="relative bg-black">
      <div ref={wrapperRef} style={{ height: `calc(${SCREEN_KEYS.length * 35}vh + 100vh)` }}>
        <div className="sticky top-0 flex h-[100svh] max-w-full items-center overflow-hidden px-4 pt-12 pb-8 md:px-8 md:pt-36 md:pb-32">
          <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
            <div className="absolute left-[8%] top-1/4 h-[420px] w-[420px] rounded-full bg-[oklch(0.72_0.19_55/0.16)] blur-[140px]" />
            <div className="absolute bottom-1/4 right-[10%] h-[460px] w-[460px] rounded-full bg-[oklch(0.55_0.24_295/0.16)] blur-[150px]" />
          </div>

          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-3 md:grid-cols-2 md:gap-16">
            {/* iPhone 18 mockup */}
            <div className="order-1 flex min-w-0 justify-center overflow-hidden md:order-2">
              <div className="relative h-[470px] w-[232px] md:h-[600px] md:w-[296px]">
                <div
                  ref={phoneRef}
                  className="absolute left-1/2 top-1/2 h-[600px] w-[296px]"
                  style={{ transform: "translate(-50%, -50%) scale(1)" }}
                >
                  <div
                    className="relative h-full w-full rounded-[3.6rem] p-[2px] shadow-[0_60px_160px_-40px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.08)_inset]"
                    style={{
                      background:
                        "linear-gradient(155deg, #f0f0f5 0%, #a5a5ad 12%, #e6e6eb 28%, #6b6b73 46%, #d8d8df 64%, #7f7f87 82%, #ededf2 100%)",
                    }}
                  >
                    {/* side buttons */}
                    <span className="pointer-events-none absolute -left-[2px] top-[120px] h-7 w-[2px] rounded-l-[1px] bg-gradient-to-b from-[#c4c4cb] to-[#6e6e76]" />
                    <span className="pointer-events-none absolute -left-[2px] top-[168px] h-12 w-[2px] rounded-l-[1px] bg-gradient-to-b from-[#c4c4cb] to-[#6e6e76]" />
                    <span className="pointer-events-none absolute -left-[2px] top-[228px] h-12 w-[2px] rounded-l-[1px] bg-gradient-to-b from-[#c4c4cb] to-[#6e6e76]" />
                    <span className="pointer-events-none absolute -right-[2px] top-[196px] h-[68px] w-[2px] rounded-r-[1px] bg-gradient-to-b from-[#c4c4cb] to-[#6e6e76]" />

                    <div className="relative h-full w-full overflow-hidden rounded-[3.45rem] bg-black p-[7px]">
                      {/* dynamic island — slimmer, pill-shaped */}
                      <div className="pointer-events-none absolute left-1/2 top-[12px] z-20 flex h-[22px] w-[82px] -translate-x-1/2 items-center justify-between rounded-full bg-black px-3">
                        <span className="h-[6px] w-[6px] rounded-full bg-[#1a1a24] ring-1 ring-white/10" />
                        <span className="h-[6px] w-[6px] rounded-full bg-[#1a1a24] ring-1 ring-white/10" />
                      </div>
                      {/* screen glare */}
                      <div className="pointer-events-none absolute inset-0 z-20 rounded-[3.45rem] bg-[linear-gradient(110deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_35%,rgba(255,255,255,0)_60%,rgba(255,255,255,0.07)_100%)]" />
                      {/* subtle bezel reflection */}
                      <div className="pointer-events-none absolute inset-0 z-20 rounded-[3.45rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.25)]" />
                      <div className="relative h-full w-full overflow-hidden rounded-[2.85rem]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={active}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -24 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="h-full w-full"
                          >
                            <Screen />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      {/* home indicator */}
                      <div className="pointer-events-none absolute bottom-[12px] left-1/2 z-20 h-[4px] w-[100px] -translate-x-1/2 rounded-full bg-white/70" />
                    </div>
                  </div>
                  {/* soft floor reflection */}
                  <div
                    className="pointer-events-none absolute -bottom-8 left-1/2 h-12 w-[70%] -translate-x-1/2 rounded-[100%] blur-2xl"
                    style={{
                      background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="order-2 md:order-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <h3 className="mt-4 font-grotesk text-xl font-bold leading-[1.1] tracking-tight text-white md:mt-5 md:text-5xl">
                    {current.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-snug text-white/60 md:mt-4 md:text-lg md:leading-relaxed">
                    {current.desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex gap-2 md:mt-8">
                {SCREENS.map((s, i) => (
                  <span
                    key={s.label}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === active ? "w-10 bg-white" : "w-5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
