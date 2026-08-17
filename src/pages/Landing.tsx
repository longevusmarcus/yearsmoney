import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Route as RouteIcon, Scale, TrendingUp } from "lucide-react";

import { Hero } from "@/components/landing/Hero";
import { IphoneShowcase } from "@/components/landing/IphoneShowcase";
import { BentoGridShowcase } from "@/components/landing/BentoGridShowcase";
import { MorphingCardStack } from "@/components/landing/MorphingCardStack";

import carImg from "@/assets/example-car.jpg";
import japanImg from "@/assets/example-japan.jpg";
import phoneImg from "@/assets/example-phone.jpg";
import fashionImg from "@/assets/example-fashion.jpg";
import yearsLogo from "@/assets/years-logo.webp";
import womanSky from "@/assets/woman-sky.png";
import womanSkyDesktop from "@/assets/woman-sky-desktop.png";
import peopleMountain from "@/assets/people-mountain.jpg";
import peopleHome from "@/assets/people-home.jpg";
import peopleRetire from "@/assets/people-retire.jpg";
import { APP_ENTRY } from "@/components/landing/appEntry";
import { useI18n } from "@/i18n/I18nProvider";


export default function Landing() {
  return (
    <div className="min-h-screen bg-[oklch(0.09_0.01_260)] text-white">
      <Hero />
      <IphoneShowcase />
      <SkyStory />
      <MoneyReimagined />
      <HowItWorks />
      <Solution />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ---------- Revolut-style building blocks ---------- */

function LightSection({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative bg-white px-4 py-24 text-[oklch(0.15_0_0)] md:px-8 md:py-36 ${className}`}
    >
      <div className="relative mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function CenteredHeader({
  title,
  sub,
  cta,
  ctaTo,
  tone = "light",
}: {
  title: string;
  sub?: string;
  cta?: string;
  ctaTo?: string;
  tone?: "light" | "dark";
}) {
  const isLight = tone === "light";
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2
        className={`font-display text-[2.6rem] leading-[1.02] md:text-[4.25rem] ${
          isLight ? "text-[oklch(0.15_0_0)]" : "text-white"
        }`}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl ${
            isLight ? "text-[oklch(0.35_0_0)]" : "text-white/65"
          }`}
        >
          {sub}
        </p>
      )}
      {cta && ctaTo && (
        <div className="mt-10">
          <Link
            to={ctaTo}
            className={`inline-flex items-center rounded-full px-8 py-4 text-base font-semibold transition-transform duration-200 hover:scale-[1.03] ${
              isLight ? "bg-[oklch(0.18_0_0)] text-white" : "bg-white text-[oklch(0.15_0_0)]"
            }`}
          >
            {cta}
          </Link>
        </div>
      )}
    </div>
  );
}

function PhotoTile({
  img,
  caption,
  value,
  action,
  footLabel,
  footValue,
  featured = false,
}: {
  img: string;
  caption: string;
  value: string;
  action: string;
  footLabel: string;
  footValue: string;
  featured?: boolean;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const rotateX = useTransform(springY, [-0.5, 0.5], ["10.5deg", "-10.5deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-10.5deg", "10.5deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { width, height, left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width - 0.5);
    mouseY.set((e.clientY - top) / height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      className={`[perspective:1200px] ${featured ? "md:-mt-8 md:mb-8 md:scale-[1.04]" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative overflow-hidden rounded-[28px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] transition-shadow duration-300 hover:shadow-[0_35px_70px_-25px_rgba(0,0,0,0.6)]"
      >
        <img
          src={img}
          alt={caption}
          loading="lazy"
          className="h-[320px] w-full object-cover md:h-[380px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />

        <div
          className="absolute inset-x-0 top-1/3 flex flex-col items-center text-center"
          style={{ transform: "translateZ(60px)" }}
        >
          <span className="text-xs text-white/80">{caption}</span>
          <span className="font-display mt-1 text-4xl text-white md:text-5xl">{value}</span>
          <span className="mt-3 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[oklch(0.15_0_0)]">
            {action}
          </span>
        </div>

        <div
          className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-sm font-medium text-[oklch(0.15_0_0)]">{footLabel}</span>
          <span className="text-sm font-semibold text-[oklch(0.15_0_0)]">{footValue}</span>
        </div>
      </motion.div>
    </div>
  );
}

function MoneyReimagined() {
  const { t } = useI18n();
  return (
    <LightSection id="il-tuo-tempo">
      <CenteredHeader
        title={t("sections.money.title")}
        sub={t("sections.money.sub")}
        cta={t("sections.money.cta")}
        ctaTo={APP_ENTRY}
      />

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
        <PhotoTile
          img={japanImg}
          caption={t("sections.money.travel")}
          value={t("sections.money.travelValue")}
          action={t("sections.money.freedomCost")}
          footLabel={t("sections.money.travelFootLabel")}
          footValue="€ 3.500"
        />
        <PhotoTile
          featured
          img={carImg}
          caption={t("sections.money.mobility")}
          value={t("sections.money.mobilityValue")}
          action={t("sections.money.freedomCost")}
          footLabel={t("sections.money.mobilityFootLabel")}
          footValue="€ 42.990"
        />
        <PhotoTile
          img={fashionImg}
          caption={t("sections.money.luxury")}
          value={t("sections.money.luxuryValue")}
          action={t("sections.money.freedomCost")}
          footLabel={t("sections.money.luxuryFootLabel")}
          footValue="€ 8.500"
        />
      </div>
    </LightSection>
  );
}

function FinalCTA() {
  const { t } = useI18n();
  return (
    <FullBleedStory
      id="inizia"
      img={peopleMountain}
      alt={t("sections.final.mountainAlt")}
      title={t("sections.final.title")}
      sub={t("sections.final.sub")}
      cta={t("sections.final.cta")}
      cardLabel={t("sections.final.cardLabel")}
      cardValue="3a 4m"
      budgetTotal="6a 7m"
      goals={[
        {
          label: t("sections.final.sabbatical"),
          img: peopleMountain,
          alt: t("sections.final.mountainAlt"),
          cardLabel: t("sections.final.sabbaticalCardLabel"),
          cardValue: "1a 2m",
          cardBudget: "6a 7m",
        },
        {
          label: t("sections.final.house"),
          img: peopleHome,
          alt: t("sections.final.homeAlt"),
          cardLabel: t("sections.final.houseCardLabel"),
          cardValue: "6a 8m",
          cardBudget: "6a 7m",
        },
        {
          label: t("sections.final.retire"),
          img: peopleRetire,
          alt: t("sections.final.retireAlt"),
          cardLabel: t("sections.final.retireCardLabel"),
          cardValue: "12a 5m",
          cardBudget: "6a 7m",
        },
      ]}
    />
  );
}

function SkyStory() {
  const { t } = useI18n();
  return (
    <FullBleedStory
      id="il-tempo-e-tuo"
      img={womanSky}
      imgDesktop={womanSkyDesktop}
      alt={t("sections.sky.imgAlt")}
      title={t("sections.sky.title")}
      sub={t("sections.sky.sub")}
      cta={t("sections.sky.cta")}
      cardLabel={t("sections.sky.cardLabel")}
      cardValue={t("sections.sky.cardValue")}
      cardAction={t("sections.sky.cardAction")}
      gradient="from-[oklch(0.70_0.10_55/0.18)] via-[oklch(0.55_0.09_85/0.10)] to-[oklch(0.35_0.12_300/0.52)]"
    />
  );
}

function FullBleedStory({
  id,
  img,
  imgDesktop,
  alt,
  title,
  sub,
  cta,
  cardLabel,
  cardValue,
  cardAction,
  budgetTotal,
  chips,
  goals,
  align = "center",
  gradient = "from-[oklch(0.72_0.16_55/0.30)] via-[oklch(0.62_0.15_290/0.22)] via-[oklch(0.55_0.14_260/0.26)] to-[oklch(0.32_0.14_300/0.55)]",
}: {
  id?: string;
  img: string;
  imgDesktop?: string;
  alt: string;
  title: string;
  sub: string;
  cta: string;
  cardLabel: string;
  cardValue: string;
  cardAction?: string;
  budgetTotal?: string;
  chips?: string[];
  goals?: {
    label: string;
    img: string;
    imgDesktop?: string;
    alt: string;
    cardLabel: string;
    cardValue: string;
    cardAction?: string;
    cardBudget?: string;
  }[];
  align?: "center" | "left";
  gradient?: string;
}) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const current = goals?.[active];
  const shownImg = current?.img ?? img;
  const shownImgDesktop = current?.imgDesktop ?? (current ? undefined : imgDesktop);
  const shownAlt = current?.alt ?? alt;
  const shownLabel = current?.cardLabel ?? cardLabel;
  const shownValue = current?.cardValue ?? cardValue;
  const shownAction = current?.cardAction ?? cardAction;
  const shownBudget = current?.cardBudget ?? budgetTotal;
  return (
    <section
      id={id}
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden md:min-h-[92vh]"
    >
      <picture>
        {shownImgDesktop && <source media="(min-width: 768px)" srcSet={shownImgDesktop} />}
        <motion.img
          key={shownImg}
          src={shownImg}
          alt={shownAlt}
          loading="eager"
          width={1920}
          height={1280}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
          {...{ fetchpriority: "high" }}
        />
      </picture>

      <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />

      <div
        className={`relative mx-auto flex h-[100svh] min-h-[640px] max-w-6xl flex-col px-6 pt-20 pb-14 md:min-h-[92vh] md:pt-36 md:pb-20 ${
          align === "left" ? "items-start text-left" : "items-center text-center"
        }`}
      >
        <h2
          className="font-display text-[2.6rem] leading-[1.02] whitespace-normal text-white md:whitespace-nowrap md:text-[4.5rem]"
          style={{ textShadow: "0 2px 30px rgba(0,0,0,0.55)" }}
        >
          {title}
        </h2>
        <p
          className="mt-4 max-w-xl text-base leading-relaxed text-white/90 md:mt-6 md:text-xl"
          style={{ textShadow: "0 1px 18px rgba(0,0,0,0.5)" }}
        >
          {sub}
        </p>
        <Link
          to={APP_ENTRY}
          className="mt-6 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[oklch(0.15_0_0)] transition-transform duration-200 hover:scale-[1.03] md:mt-9 md:px-8 md:py-4 md:text-base"
        >
          {cta}
        </Link>

        <div className="mt-auto pt-10 md:pt-16">
          <motion.div
            key={shownLabel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-3xl border border-white/25 bg-white/5 px-6 py-4 text-center backdrop-blur-md md:px-10 md:py-6"
          >
            <span className="text-xs text-white/70">{shownLabel}</span>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
              {t("sections.final.priceInTime")}
            </div>
            <div className="font-display mt-1 text-3xl text-white md:text-5xl">{shownValue}</div>
            {shownBudget && (
              <div className="mt-1 text-xs text-white/70">
                {t("sections.final.freedomBudget")}: <span className="font-semibold text-white">{shownBudget}</span>
              </div>
            )}
            {shownAction && (
              <span className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-[oklch(0.15_0_0)]">
                {shownAction}
              </span>
            )}
          </motion.div>

          {goals && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-8">
              {goals.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-[1.04] md:px-6 md:py-3 md:text-sm ${
                    i === active
                      ? "bg-white text-[oklch(0.15_0_0)]"
                      : "border border-white/30 bg-black/30 text-white backdrop-blur-md hover:bg-black/45"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {chips && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-8">
              {chips.map((c, i) => (
                <span
                  key={c}
                  className={`rounded-full px-4 py-2 text-xs font-semibold md:px-6 md:py-3 md:text-sm ${
                    i === 0
                      ? "bg-white text-[oklch(0.15_0_0)]"
                      : "border border-white/30 bg-black/30 text-white backdrop-blur-md"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Shared shell — soft gradient blobs + subtle grain */
function SectionShell({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative scroll-mt-0 px-4 py-28 md:px-8 md:py-36 ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[oklch(0.55_0.24_295/0.10)] blur-[180px]" />
      </div>
      <div className="relative mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-16">
      <CenteredHeader title={title} sub={sub} tone="dark" />
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_20px_80px_-30px_oklch(0.5_0.15_270/0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

function Solution() {
  const { t } = useI18n();
  return (
    <SectionShell id="soluzione">
      <h2 className="mb-12 flex flex-wrap items-center justify-center gap-1 text-center font-grotesk text-4xl font-medium leading-[1.05] tracking-tight text-white md:text-6xl">
        <span>{t("terminology.heading")}</span>
        <span className="flex items-center">
          <img
            src={yearsLogo}
            alt={t("common.logoAlt")}
            className="h-16 w-16 object-contain md:h-24 md:w-24"
          />
          <span className="-ml-5 font-cormorant italic leading-none tracking-[0.02em] text-white md:-ml-7">
            ears
          </span>
        </span>
      </h2>
      <MorphingCardStack
        defaultLayout="stack"
        cards={[
          {
            id: "buffer-zero",
            icon: <Scale className="h-5 w-5" strokeWidth={1.5} />,
            kicker: t("terminology.bufferZeroKicker"),
            title: t("terminology.bufferZeroTitle"),
            description: t("terminology.bufferZeroDesc"),
          },
          {
            id: "buffer-one",
            icon: <TrendingUp className="h-5 w-5" strokeWidth={1.5} />,
            kicker: t("terminology.bufferOneKicker"),
            title: t("terminology.bufferOneTitle"),
            description: t("terminology.bufferOneDesc"),
          },
          {
            id: "time-advisor",
            icon: <RouteIcon className="h-5 w-5" strokeWidth={1.5} />,
            kicker: t("terminology.advisorKicker"),
            title: t("terminology.advisorTitle"),
            description: t("terminology.advisorDesc"),
          },
        ]}
      />
    </SectionShell>
  );
}

function PurchaseCard({
  img,
  kicker,
  equals,
  label,
  price,
  time,
  detail,
}: {
  img: string;
  kicker: string;
  equals: string;
  label: string;
  price: string;
  time: string;
  detail: string;
}) {
  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <img
        src={img}
        alt={label}
        loading="lazy"
        width={768}
        height={512}
        className="h-40 w-full object-cover"
      />
      <div className="flex flex-1 flex-col p-7">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">{kicker}</div>
        <div className="mt-2 text-sm text-white/80">{label}</div>
        <div className="mt-1 font-grotesk text-3xl font-medium text-white">{price}</div>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-white/40">{equals}</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="logo-gradient-text mt-4 text-2xl font-medium">{time}</div>
          <div className="mt-1 text-xs text-white/50">{detail}</div>
        </div>
      </div>
    </GlassCard>
  );
}

function FlowCard() {
  const { t } = useI18n();
  const steps = [
    { k: t("sections.how.howMuchHave"), v: "€ 300.000" },
    { k: t("sections.how.howMuchEarn"), v: `€ 5.000 ${t("sections.how.perMonth")}` },
    { k: t("sections.how.howMuchSpend"), v: `€ 3.800 ${t("sections.how.perMonth")}` },
  ];
  return (
    <GlassCard className="flex h-full flex-col p-8">
      <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">{t("sections.how.flowKicker")}</div>
      <h3 className="mt-3 font-grotesk text-2xl font-medium text-white">
        {t("sections.how.flowTitle")}
      </h3>

      <div className="mt-8 space-y-4">
        {steps.map((s, i) => (
          <div key={s.k}>
            <div className="flex items-baseline justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
              <span className="text-xs text-white/50">{s.k}</span>
              <span className="text-lg font-bold text-white">{s.v}</span>
            </div>
            {i < steps.length - 1 && <div className="mx-auto my-1 h-4 w-px bg-white/15" />}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] uppercase tracking-widest text-white/50">{t("sections.how.result")}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="mt-6">
        <div className="logo-gradient-text font-grotesk text-4xl font-medium">{t("sections.how.resultValue")}</div>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          {t("sections.how.resultCopyBefore")}{" "}
          <span className="text-white">{t("sections.how.resultCopyHighlight")}</span>{" "}
          {t("sections.how.resultCopyAfter")}
        </p>
      </div>

      <MiniYearsChart />
    </GlassCard>
  );
}

function MiniYearsChart() {
  const { t } = useI18n();
  const data = [
    { y: "2026", v: 6.6 },
    { y: "2027", v: 6.9 },
    { y: "2028", v: 7.4 },
    { y: "2029", v: 8.1 },
    { y: "2030", v: 8.9 },
    { y: "2031", v: 9.8 },
  ];
  const max = 10.5;
  const H = 96;

  const [auto, setAuto] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setAuto((a) => (a + 1) % data.length), 1400);
    return () => clearInterval(id);
  }, [data.length]);

  const active = hover ?? auto;
  const fmt = (v: number) => `${Math.floor(v)}a ${Math.round((v % 1) * 12)}m`;

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          {t("sections.how.chartTitle")}
        </span>
        <motion.span
          key={active}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="logo-gradient-text text-xs font-bold"
        >
          {data[active].y} · {fmt(data[active].v)}
        </motion.span>
      </div>

      <div className="mt-5 flex items-end gap-2" style={{ height: H }}>
        {data.map((d, i) => {
          const isActive = i === active;
          return (
            <div
              key={d.y}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="group flex h-full flex-1 cursor-pointer flex-col justify-end gap-2"
            >
              <motion.div
                initial={{ height: 6 }}
                animate={{
                  height: Math.max(6, (d.v / max) * (H - 18)),
                  opacity: isActive ? 1 : 0.45,
                  scaleY: isActive ? 1.06 : 1,
                }}
                transition={{
                  height: { duration: 0.9, delay: i * 0.09, ease: "easeOut" },
                  opacity: { duration: 0.35 },
                  scaleY: { duration: 0.35 },
                }}
                style={{
                  originY: 1,
                  background:
                    "linear-gradient(to top, oklch(0.55 0.22 300 / 0.55), oklch(0.88 0.13 90 / 0.95))",
                  boxShadow: isActive ? "0 0 18px oklch(0.7 0.18 300 / 0.45)" : "none",
                }}
                className="w-full rounded-t-md"
              />
              <span
                className={`text-center text-[9px] transition-colors ${
                  isActive ? "text-white/80" : "text-white/30"
                }`}
              >
                {d.y.slice(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-[11px] text-white/45">
        {t("sections.how.chartFootBefore")} <span className="text-white/80">6a 7m</span>{" "}
        {t("sections.how.chartFootMiddle")} <span className="text-white/80">9a 10m</span>{" "}
        {t("sections.how.chartFootAfter")}
      </div>
    </div>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  return (
    <SectionShell id="come-funziona" className="bg-[oklch(0.16_0.005_260)]">
      <SectionHeader
        title={t("sections.how.title")}
        sub={t("sections.how.sub")}
      />

      <BentoGridShowcase
        integration={<FlowCard />}
        trackers={
          <PurchaseCard
            img={phoneImg}
            kicker={t("sections.how.purchase")}
            equals={t("sections.how.equals")}
            label={t("sections.how.phoneLabel")}
            price="€ 1.200"
            time={t("sections.how.phoneTime")}
            detail={t("sections.how.phoneDetail")}
          />
        }
        statistic={
          <PurchaseCard
            img={japanImg}
            kicker={t("sections.how.purchase")}
            equals={t("sections.how.equals")}
            label={t("sections.how.japanLabel")}
            price="€ 3.500"
            time={t("sections.how.japanTime")}
            detail={t("sections.how.japanDetail")}
          />
        }
        focus={
          <PurchaseCard
            img={carImg}
            kicker={t("sections.how.purchase")}
            equals={t("sections.how.equals")}
            label={t("sections.how.carLabel")}
            price="€ 42.990"
            time={t("sections.how.carTime")}
            detail={t("sections.how.carDetail")}
          />
        }
        productivity={
          <PurchaseCard
            img={fashionImg}
            kicker={t("sections.how.purchase")}
            equals={t("sections.how.equals")}
            label={t("sections.how.fashionLabel")}
            price="€ 8.500"
            time={t("sections.how.fashionTime")}
            detail={t("sections.how.fashionDetail")}
          />
        }
      />
    </SectionShell>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/10 px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-14 w-14 object-contain" />
            <span className="-ml-4 font-cormorant text-3xl italic leading-none tracking-[0.02em] text-white">
              ears
            </span>
          </div>
          <div className="mt-2 text-xs text-white/40">{t("footer.tagline")}</div>
        </div>
        <div className="flex gap-8 text-sm text-white/60">
          <Link to="/ubi" className="hover:text-white">
            {t("footer.ubi")}
          </Link>
          <Link to="/privacy" className="hover:text-white">
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" className="hover:text-white">
            {t("footer.terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
