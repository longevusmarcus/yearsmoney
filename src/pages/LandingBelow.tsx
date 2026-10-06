// Below-the-fold landing sections. Split out of Landing so the initial mobile
// bundle only contains the hero — this chunk loads after first paint.
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useScroll, type MotionValue } from "framer-motion";
import { Route as RouteIcon, Scale, TrendingUp } from "lucide-react";

import { IphoneShowcase } from "@/components/landing/IphoneShowcase";
import { BentoGridShowcase } from "@/components/landing/BentoGridShowcase";
import { MorphingCardStack } from "@/components/landing/MorphingCardStack";

import carImg from "@/assets/example-car.jpg";
import japanImg from "@/assets/example-japan.jpg";
import phoneImg from "@/assets/example-phone.jpg";
import fashionImg from "@/assets/example-fashion.jpg";
import yearsLogo from "@/assets/years-logo.webp";
import womanSky from "@/assets/woman-sky.jpg";
import peopleMountain from "@/assets/people-mountain.jpg";
import peopleHome from "@/assets/people-home.jpg";
import peopleRetire from "@/assets/people-retire.jpg";
import { APP_ENTRY } from "@/components/landing/appEntry";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";


export default function LandingBelow() {
  return (
    <>
      <Statement />
      <IphoneShowcase />
      <SkyStory />
      <MoneyReimagined />
      <HowItWorks />
      <Solution />
      <FinalCTA />
      <Footer />
    </>
  );
}

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
      className={`relative bg-background px-5 py-24 text-foreground md:px-6 md:py-36 ${className}`}
    >
      <div className="relative mx-auto max-w-[1180px]">{children}</div>
    </section>
  );
}

/** Terafab-style statement: words rise and un-blur one after another on viewport entry. */
function WordReveal({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      transition={{ staggerChildren: 0.06 }}
      className="inline"
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          variants={{
            hidden: { opacity: 0.12, y: 14, filter: "blur(6px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
          }}
        >
          {w + (i < words.length - 1 ? " " : "")}
        </motion.span>
      ))}
    </motion.span>
  );
}

/** Terafab statement: left-aligned large copy whose words brighten as you scroll. */
function Statement() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = t("sections.money.sub").split(" ");
  return (
    <section className="bg-background px-5 py-24 md:px-6 md:py-36">
      <div ref={ref} className="mx-auto max-w-[1180px]">
        <p className="max-w-3xl font-tight text-[2rem] leading-[1.12] md:text-[3.25rem]">
          {words.map((w, i) => (
            <ScrollWord key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </ScrollWord>
          ))}
        </p>
      </div>
    </section>
  );
}

function ScrollWord({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.28, 1]);
  return <motion.span style={{ opacity }} className="text-foreground">{children} </motion.span>;
}

function CenteredHeader({
  title,
  sub,
  cta,
  ctaTo,
  tone = "dark",
}: {
  title: string;
  sub?: string;
  cta?: string;
  ctaTo?: string;
  tone?: "light" | "dark";
}) {
  void tone;
  return (
    <div className="max-w-3xl text-left">
      <h2 className="font-tight text-[2.6rem] leading-[1.02] text-foreground md:text-[4.25rem]">
        <WordReveal text={title} />
      </h2>
      {sub && (
        <p
          className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/65 md:text-xl"
        >
          {sub}
        </p>
      )}
      {cta && ctaTo && (
        <div className="mt-10">
          <Button asChild variant="editorial"><Link to={ctaTo}>{cta}</Link></Button>
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
      className={`[perspective:1200px] ${featured ? "" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative overflow-hidden rounded-[4px]"
      >
        <img
          src={img}
          alt={caption}
          loading="lazy"
          className="h-[320px] w-full object-cover md:h-[380px]"
        />
        <div className="absolute inset-0 landing-photo-shade" />

        <div
          className="absolute inset-x-5 bottom-24 flex flex-col items-start text-left"
          style={{ transform: "translateZ(60px)" }}
        >
          <span className="text-xs text-foreground/80">{caption}</span>
          <span className="font-tight mt-1 text-4xl text-foreground md:text-5xl">{value}</span>
          <span className="mt-3 border-t border-foreground/30 pt-2 text-xs text-foreground/80">
            {action}
          </span>
        </div>

        <div
          className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 border-t border-foreground/30 pt-4"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-sm font-normal text-foreground">{footLabel}</span>
          <span className="text-sm font-normal text-foreground">{footValue}</span>
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

      <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
        <PhotoTile
          img={japanImg}
          caption={t("sections.money.travel")}
          value={t("sections.money.travelValue")}
          action={t("sections.money.freedomCost")}
          footLabel={t("sections.money.travelFootLabel")}
          footValue={t("sections.money.travelFootValue")}
        />
        <PhotoTile
          featured
          img={carImg}
          caption={t("sections.money.mobility")}
          value={t("sections.money.mobilityValue")}
          action={t("sections.money.freedomCost")}
          footLabel={t("sections.money.mobilityFootLabel")}
          footValue={t("sections.money.mobilityFootValue")}
        />
        <PhotoTile
          img={fashionImg}
          caption={t("sections.money.luxury")}
          value={t("sections.money.luxuryValue")}
          action={t("sections.money.freedomCost")}
          footLabel={t("sections.money.luxuryFootLabel")}
          footValue={t("sections.money.luxuryFootValue")}
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
      cardValue={t("sections.final.newGoalValue")}
      budgetTotal={t("sections.final.budgetValue")}
      goals={[
        {
          label: t("sections.final.sabbatical"),
          img: peopleMountain,
          alt: t("sections.final.mountainAlt"),
          cardLabel: t("sections.final.sabbaticalCardLabel"),
          cardValue: t("sections.final.sabbaticalValue"),
          cardBudget: t("sections.final.budgetValue"),
        },
        {
          label: t("sections.final.house"),
          img: peopleHome,
          alt: t("sections.final.homeAlt"),
          cardLabel: t("sections.final.houseCardLabel"),
          cardValue: t("sections.final.houseValue"),
          cardBudget: t("sections.final.budgetValue"),
        },
        {
          label: t("sections.final.retire"),
          img: peopleRetire,
          alt: t("sections.final.retireAlt"),
          cardLabel: t("sections.final.retireCardLabel"),
          cardValue: t("sections.final.retireValue"),
          cardBudget: t("sections.final.budgetValue"),
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
      alt={t("sections.sky.imgAlt")}
      title={t("sections.sky.title")}
      sub={t("sections.sky.sub")}
      cta={t("sections.sky.cta")}
      cardLabel={t("sections.sky.cardLabel")}
      cardValue={t("sections.sky.cardValue")}
      cardAction={t("sections.sky.cardAction")}
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
  align = "left",
  eager = false,
  gradient = "landing-story-shade",
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
  /** Only set on a story that can actually be in the first viewport. */
  eager?: boolean;
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
      className="relative min-h-[80svh] w-full overflow-hidden md:min-h-[92vh]"
    >
      <picture>
        {shownImgDesktop && <source media="(min-width: 768px)" srcSet={shownImgDesktop} />}
        <motion.img
          key={shownImg}
          src={shownImg}
          alt={shownAlt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={1920}
          height={1280}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
          {...(eager ? { fetchpriority: "high" } : {})}
        />
      </picture>

      <div className={`absolute inset-0 ${gradient}`} />

      <div
        className={`relative mx-auto flex min-h-[80svh] max-w-[1180px] flex-col justify-end px-5 pt-24 pb-10 md:min-h-[92vh] md:px-6 md:pt-36 md:pb-14 ${
          align === "left" ? "items-start text-left" : "items-center text-center"
        }`}
      >
        <h2
          className="max-w-3xl font-tight text-[2.6rem] leading-[1.02] whitespace-pre-line text-foreground md:text-[4.25rem]"
        >
          {title}
        </h2>
        <p
          className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/90 md:text-xl"
        >
          {sub}
        </p>
        <Button asChild variant="editorial" className="mt-7"><Link to={APP_ENTRY}>{cta}</Link></Button>

        <div className="mt-12 w-full border-t border-foreground/25 pt-6 md:mt-20">
          <motion.div
            key={shownLabel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-left"
          >
            <span className="text-xs text-foreground/70">{shownLabel}</span>
            <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
              {t("sections.final.priceInTime")}
            </div>
            <div className="font-tight mt-1 text-2xl text-foreground md:text-5xl">{shownValue}</div>
            {shownBudget && (
              <div className="mt-1 text-xs text-foreground/70">
                {t("sections.final.freedomBudget")}: <span className="font-normal text-foreground">{shownBudget}</span>
              </div>
            )}
            {shownAction && (
              <span className="mt-2 inline-block border-t border-foreground/30 pt-2 text-xs text-foreground/80">
                {shownAction}
              </span>
            )}
          </motion.div>

          {goals && (
            <div className="mt-6 flex flex-wrap items-center justify-start gap-3 md:mt-8">
              {goals.map((g, i) => (
                <Button
                  key={g.label}
                  variant={i === active ? "editorial" : "editorialOutline"}
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                >
                  {g.label}
                </Button>
              ))}
            </div>
          )}

          {chips && (
            <div className="mt-6 flex flex-wrap items-center justify-start gap-3 md:mt-8">
              {chips.map((c, i) => (
                <span
                  key={c}
                  className={`rounded-full px-4 py-2 text-xs font-normal md:px-6 md:py-3 md:text-sm ${
                    i === 0
                      ? "bg-foreground text-foreground"
                      : "border border-foreground/30 bg-black/30 text-foreground backdrop-blur-md"
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
    <section id={id} className={`relative bg-background scroll-mt-0 px-5 py-24 md:px-6 md:py-36 ${className}`}>
      <div className="relative mx-auto max-w-[1180px]">{children}</div>
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
      className={`rounded-[4px] border border-border bg-card ${className}`}
    >
      {children}
    </div>
  );
}

function Solution() {
  const { t } = useI18n();
  return (
    <SectionShell id="soluzione">
      <h2 className="mb-12 flex flex-wrap items-center justify-start gap-3 text-left font-tight text-[2.6rem] leading-[1.02] text-foreground md:text-[4.25rem]">
        <span>{t("terminology.heading")}</span>
        <span className="flex items-center">
          <img
            src={yearsLogo}
            alt={t("common.logoAlt")}
            className="h-16 w-16 object-contain md:h-24 md:w-24"
          />
          <span className="-ml-5 font-cormorant italic leading-none tracking-[0.02em] text-foreground md:-ml-7">
            ears
          </span>
        </span>
      </h2>
      <MorphingCardStack
        defaultLayout="list"
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
        <div className="text-[11px] uppercase tracking-[0.22em] text-foreground/40">{kicker}</div>
        <div className="mt-2 text-sm text-foreground/80">{label}</div>
        <div className="mt-1 font-tight text-3xl font-normal text-foreground">{price}</div>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-foreground/10" />
            <span className="text-[10px] uppercase tracking-widest text-foreground/40">{equals}</span>
            <span className="h-px flex-1 bg-foreground/10" />
          </div>
          <div className="text-foreground mt-4 text-2xl font-normal">{time}</div>
          <div className="mt-1 text-xs text-foreground/50">{detail}</div>
        </div>
      </div>
    </GlassCard>
  );
}

function FlowCard() {
  const { t } = useI18n();
  const steps = [
    { k: t("sections.how.howMuchHave"), v: t("sections.how.haveValue") },
    { k: t("sections.how.howMuchEarn"), v: `${t("sections.how.earnValue")} ${t("sections.how.perMonth")}` },
    { k: t("sections.how.howMuchSpend"), v: `${t("sections.how.spendValue")} ${t("sections.how.perMonth")}` },
  ];
  return (
    <GlassCard className="flex h-full flex-col p-8">
      <div className="text-[11px] uppercase tracking-[0.22em] text-foreground/40">{t("sections.how.flowKicker")}</div>
      <h3 className="mt-3 font-tight text-2xl font-normal text-foreground">
        {t("sections.how.flowTitle")}
      </h3>

      <div className="mt-8 space-y-4">
        {steps.map((s, i) => (
          <div key={s.k}>
            <div className="flex items-baseline justify-between gap-4 border-b border-border py-4">
              <span className="text-xs text-foreground/50">{s.k}</span>
              <span className="text-lg font-normal text-foreground">{s.v}</span>
            </div>
            {i < steps.length - 1 && <div className="mx-auto my-1 h-4 w-px bg-foreground/15" />}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-foreground/10" />
        <span className="text-[10px] uppercase tracking-widest text-foreground/50">{t("sections.how.result")}</span>
        <span className="h-px flex-1 bg-foreground/10" />
      </div>

      <div className="mt-6">
        <div className="text-foreground font-tight text-4xl font-normal">{t("sections.how.resultValue")}</div>
        <p className="mt-3 text-sm leading-relaxed text-foreground/60">
          {t("sections.how.resultCopyBefore")}{" "}
          <span className="text-foreground">{t("sections.how.resultCopyHighlight")}</span>{" "}
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
    <div className="mt-8 border-t border-border pt-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          {t("sections.how.chartTitle")}
        </span>
        <motion.span
          key={active}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-foreground text-xs font-normal"
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
                }}
                className="w-full bg-foreground"
              />
              <span
                className={`text-center text-[9px] transition-colors ${
                  isActive ? "text-foreground/80" : "text-foreground/30"
                }`}
              >
                {d.y.slice(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-[11px] text-foreground/45">
        {t("sections.how.chartFootBefore")}{" "}
        <span className="text-foreground/80">{t("sections.how.chartFootFrom")}</span>{" "}
        {t("sections.how.chartFootMiddle")}{" "}
        <span className="text-foreground/80">{t("sections.how.chartFootTo")}</span>{" "}
        {t("sections.how.chartFootAfter")}
      </div>
    </div>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  return (
    <SectionShell id="come-funziona" className="bg-background">
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
            price={t("sections.how.phonePrice")}
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
            price={t("sections.how.japanPrice")}
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
            price={t("sections.how.carPrice")}
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
            price={t("sections.how.fashionPrice")}
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
    <footer className="border-t border-foreground/10 px-5 py-12 md:px-6">
      <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-14 w-14 object-contain" />
            <span className="-ml-4 font-cormorant text-3xl italic leading-none tracking-[0.02em] text-foreground">
              ears
            </span>
          </div>
          <div className="mt-2 text-xs text-foreground/40">{t("footer.tagline")}</div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-foreground/60">
          <Link to="/ubi" className="hover:text-foreground">
            {t("footer.ubi")}
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            {t("footer.terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
