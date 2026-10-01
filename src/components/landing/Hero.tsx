import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import yearsLogo from "@/assets/years-logo.webp";
import homeScreen from "@/assets/showcase-home.png";
import purchaseScreen from "@/assets/showcase-purchase-1.png";
import risksScreen from "@/assets/showcase-risks.png";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { APP_ENTRY } from "./appEntry";

function TypedHeadline() {
  const { t } = useI18n();
  const full = t("hero.headline");
  const highlight = t("hero.headlineHighlight");
  const start = full.indexOf(highlight);
  const end = start >= 0 ? start + highlight.length : -1;
  const [length, setLength] = useState(0);

  useEffect(() => setLength(0), [full]);
  useEffect(() => {
    if (length >= full.length) return;
    const timer = window.setTimeout(() => setLength((value) => value + 1), 42);
    return () => window.clearTimeout(timer);
  }, [length, full.length]);

  const typed = full.slice(0, length);
  const before = start < 0 ? typed : typed.slice(0, Math.min(length, start));
  const emphasis = start < 0 ? "" : typed.slice(Math.min(length, start), Math.min(length, end));
  const after = start < 0 ? "" : typed.slice(Math.min(length, end));

  return (
    <span>
      {before}
      <em className="font-cormorant font-normal text-muted-foreground">{emphasis}</em>
      {after}
      <span aria-hidden className="ml-1 inline-block h-[0.75em] w-px bg-foreground/60 align-middle" />
    </span>
  );
}

function scrollToShowcase(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById("scopri")?.scrollIntoView({ behavior: "smooth" });
}

const phones = [
  { src: purchaseScreen, alt: "YEARS — costo degli acquisti in tempo", position: "left" },
  { src: homeScreen, alt: "YEARS — panoramica degli anni di libertà", position: "center" },
  { src: risksScreen, alt: "YEARS — analisi dei rischi", position: "right" },
] as const;

const Hero = () => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const motionDelay = (value: number) => (isMobile ? 0 : value);

  return (
    <section id="top" className="landing-frame relative min-h-[100svh] overflow-hidden bg-background p-2 text-foreground md:p-6">
      <div className="landing-canvas relative mx-auto flex min-h-[calc(100svh-1rem)] max-w-[1440px] flex-col overflow-hidden rounded-[2rem] border border-border md:min-h-[calc(100svh-3rem)] md:rounded-[3rem]">
        <div aria-hidden className="landing-ambient pointer-events-none absolute inset-x-0 top-0 h-[55%]" />
        <div aria-hidden className="landing-grain pointer-events-none absolute inset-0 opacity-[0.08]" />

        <motion.nav
          initial={{ opacity: 0, x: "-50%", y: -16 }}
          animate={{ opacity: 1, x: "-50%", y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute left-1/2 top-3 z-50 flex w-[calc(100%-1rem)] -translate-x-1/2 items-center justify-between rounded-full border border-border bg-popover/80 px-2 py-1.5 shadow-2xl backdrop-blur-xl md:top-6 md:w-auto md:min-w-[620px] md:px-3"
        >
          <a href="#top" aria-label="Years" className="flex shrink-0 items-center pr-1">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-9 w-9 object-contain md:h-10 md:w-10" />
            <span className="-ml-2.5 font-cormorant text-xl italic leading-none md:text-2xl">ears</span>
          </a>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#scopri" onClick={scrollToShowcase} className="transition-colors hover:text-foreground">{t("hero.ctaSecondary")}</a>
            <Link to="/filosofia" className="transition-colors hover:text-foreground">{t("hero.badge")}</Link>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <LanguageSwitcher className="h-9" />
            <Button asChild variant="ghost" size="sm" className="hidden border border-border sm:inline-flex">
              <Link to="/auth">{t("nav.join")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={APP_ENTRY}>{t("nav.calculate")}</Link>
            </Button>
          </div>
        </motion.nav>

        <div className="relative z-10 flex flex-1 flex-col items-center px-4 pt-24 text-center md:px-8 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: motionDelay(0.15) }}
          >
            <Link to="/filosofia" className="group inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              {t("hero.badge")}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: motionDelay(0.25), ease: "easeOut" }}
            className="mt-5 max-w-5xl font-grotesk text-[3.15rem] font-medium leading-[0.92] sm:text-6xl md:mt-7 md:text-[5.8rem]"
          >
            <TypedHeadline />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: motionDelay(0.4) }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:mt-7 md:text-xl"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: motionDelay(0.5) }}
            className="mt-2 hidden max-w-xl text-sm text-muted-foreground/70 md:block"
          >
            {t("hero.subSecondary")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: motionDelay(0.55) }}
            className="mt-5 flex items-center gap-3 md:mt-8"
          >
            <Button asChild size="lg" className="h-12 px-7">
              <Link to={APP_ENTRY}>{t("hero.ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 bg-card px-7">
              <a href="#scopri" onClick={scrollToShowcase}>{t("hero.ctaSecondary")}</a>
            </Button>
          </motion.div>

          <div className="relative mt-auto h-[31vh] min-h-[225px] w-full max-w-5xl md:h-[43vh] md:min-h-[340px]">
            {phones.map((phone, index) => {
              const side = phone.position !== "center";
              return (
                <motion.div
                  key={phone.position}
                  initial={{ opacity: 0, y: 90, rotate: 0 }}
                  animate={{ opacity: side ? 0.62 : 1, y: 0, rotate: phone.position === "left" ? -10 : phone.position === "right" ? 10 : 0 }}
                  transition={{ duration: 0.9, delay: motionDelay(0.65 + index * 0.08), ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute bottom-[-26%] overflow-hidden rounded-[2rem] border-[3px] border-border bg-popover p-1.5 shadow-2xl transition-transform duration-700 hover:-translate-y-3 md:rounded-[2.8rem] md:border-4 md:p-2 ${
                    phone.position === "center"
                      ? "left-1/2 z-20 w-[11.5rem] -translate-x-1/2 md:w-[17rem]"
                      : phone.position === "left"
                        ? "left-[2%] z-10 hidden w-[15rem] sm:block md:left-[16%]"
                        : "right-[2%] z-10 hidden w-[15rem] sm:block md:right-[16%]"
                  }`}
                >
                  <img src={phone.src} alt={phone.alt} className="block h-auto w-full rounded-[1.55rem] md:rounded-[2.15rem]" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero };