import { ArrowDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import yearsLogo from "@/assets/years-logo.webp";
import appHome from "@/assets/app-home.png";
import { APP_ENTRY } from "./appEntry";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const reveal = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

const Hero = () => {
  const { t } = useI18n();

  return (
    <section id="top" className="relative min-h-[96svh] overflow-hidden bg-landing text-landing-foreground">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="absolute inset-x-0 top-0 z-30"
      >
        <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 md:h-24 md:px-8">
          <a href="#top" className="flex items-center" aria-label={t("common.logoAlt")}>
            <img src={yearsLogo} alt="" className="h-10 w-10 object-contain" />
            <span className="-ml-3 font-cormorant text-2xl italic leading-none">ears</span>
          </a>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher className="h-10 text-landing-foreground" />
            <Link
              to="/auth"
              className="hidden h-10 items-center px-3 text-sm font-medium transition-opacity hover:opacity-60 sm:inline-flex"
            >
              {t("nav.join")}
            </Link>
            <Link
              to={APP_ENTRY}
              className="inline-flex h-10 items-center rounded-full bg-landing-foreground px-5 text-sm font-semibold text-landing transition-transform hover:scale-[1.03] active:scale-95"
            >
              {t("nav.calculate")}
            </Link>
          </div>
        </nav>
      </motion.header>

      <div className="mx-auto flex min-h-[96svh] max-w-6xl flex-col items-center px-5 pb-8 pt-28 text-center md:px-8 md:pt-32">
        <div className="flex flex-1 flex-col items-center justify-center pb-8 md:pb-0">
          <motion.img
            {...reveal}
            transition={{ duration: 0.55 }}
            src={yearsLogo}
            alt={t("common.logoAlt")}
            className="h-20 w-20 object-contain md:h-24 md:w-24"
          />
          <motion.h1
            {...reveal}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="mt-5 max-w-4xl text-balance font-grotesk text-[2.75rem] font-medium leading-[1.02] sm:text-6xl md:text-[4.6rem]"
          >
            {t("hero.headline")}
          </motion.h1>
          <motion.p
            {...reveal}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-6 max-w-xl text-balance text-base leading-relaxed text-landing-muted md:text-lg"
          >
            {t("hero.sub")}
          </motion.p>
          <motion.div
            {...reveal}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              to={APP_ENTRY}
              className="inline-flex min-w-56 items-center justify-center gap-2 rounded-full bg-landing-accent px-7 py-3.5 text-sm font-semibold text-landing-accent-foreground transition-transform hover:scale-[1.03] active:scale-95"
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/auth" className="text-sm font-medium underline decoration-1 underline-offset-4 sm:hidden">
              {t("nav.join")}
            </Link>
          </motion.div>
        </div>

        <motion.a
          href="#scopri"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-2 inline-flex items-center gap-2 rounded-full bg-landing-soft px-4 py-2 text-xs font-medium transition-colors hover:bg-landing-soft-hover"
        >
          {t("hero.ctaSecondary")}
          <ArrowDown className="h-3.5 w-3.5" />
        </motion.a>
      </div>

      <img
        src={appHome}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-44 left-1/2 hidden w-[260px] -translate-x-1/2 rounded-[38px] border-[7px] border-landing-foreground object-cover opacity-0 md:block"
      />
    </section>
  );
};

export { Hero };