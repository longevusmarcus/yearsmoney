import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import yearsLogo from "@/assets/years-logo.webp";
import homeScreen from "@/assets/showcase-home.png";
import purchaseScreen from "@/assets/showcase-purchase-1.png";
import risksScreen from "@/assets/showcase-risks.png";
import testimonialOne from "@/assets/testimonial-1.png";
import testimonialTwo from "@/assets/testimonial-2.jpeg";
import testimonialThree from "@/assets/testimonial-3.jpeg";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { APP_ENTRY } from "./appEntry";

function HeroHeadline() {
  const { t } = useI18n();
  const full = t("hero.headline");
  const highlight = t("hero.headlineHighlight");
  const start = full.indexOf(highlight);
  if (start < 0) return <>{full}</>;

  return (
    <>
      {full.slice(0, start)}
      <em>{highlight}</em>
      {full.slice(start + highlight.length)}
    </>
  );
}

const Hero = () => {
  const { t, lang } = useI18n();

  return (
    <div className="years-chapters-shell">
      <nav className="years-chapters-nav" aria-label="Primary">
        <a href="#top" aria-label="Years home" className="years-wordmark">
          <img src={yearsLogo} alt="" />
          <span>ears</span>
        </a>

        <div className="years-nav-links">
          <a href="#come-funziona">{lang === "it" ? "Come funziona" : "How it works"}</a>
          <a href="#community">Community</a>
          <Link to="/filosofia">{lang === "it" ? "Filosofia" : "Philosophy"}</Link>
        </div>

        <div className="years-nav-right">
          <LanguageSwitcher className="h-10" />
          <Button asChild size="sm" className="years-nav-cta">
            <Link to={APP_ENTRY}>{t("nav.calculate")}</Link>
          </Button>
        </div>
      </nav>

      <section id="top" className="years-chapters-fold">
        <div aria-hidden className="years-fold-gradient" />
        <div aria-hidden className="years-fold-atmosphere" />

        <div className="years-fold-stack">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="years-capsule"
            role="note"
          >
            <span className="years-capsule-avatars" aria-hidden>
              {[testimonialOne, testimonialTwo, testimonialThree].map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </span>
            <span>{lang === "it" ? "Scelto da chi misura la vita in tempo" : "For people who measure life in time"}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="years-hero-title"
          >
            <HeroHeadline />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16 }}
            className="years-hero-description"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24 }}
            className="years-cta-row"
          >
            <Button asChild size="lg" className="years-cta years-cta-primary">
              <Link to={APP_ENTRY}>{t("hero.ctaPrimary")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="years-cta years-cta-secondary">
              <a href="#scopri">{t("hero.ctaSecondary")}</a>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 90 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="years-fold-trio"
          aria-hidden
        >
          <div className="years-trio-side years-trio-left"><img src={purchaseScreen} alt="" /></div>
          <div className="years-trio-center"><img src={homeScreen} alt="" /></div>
          <div className="years-trio-side years-trio-right"><img src={risksScreen} alt="" /></div>
        </motion.div>
      </section>
    </div>
  );
};

export { Hero };
