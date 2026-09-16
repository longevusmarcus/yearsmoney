import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import appHome from "@/assets/app-home.png";
import appPurchase from "@/assets/app-purchase.png";
import appRisks from "@/assets/app-risks.png";
import appOptional from "@/assets/app-optional.png";
import womanSky from "@/assets/woman-sky.jpg";
import peopleMountain from "@/assets/people-mountain.jpg";
import yearsLogo from "@/assets/years-logo.webp";
import { APP_ENTRY } from "@/components/landing/appEntry";
import { useI18n } from "@/i18n/I18nProvider";

type FeatureProps = {
  title: string;
  body: string;
  image: string;
  alt: string;
  tone: "violet" | "mint" | "gold" | "blue";
  reverse?: boolean;
};

const tones = {
  violet: "bg-landing-violet",
  mint: "bg-landing-mint",
  gold: "bg-landing-gold",
  blue: "bg-landing-blue",
};

function SectionHeading({ title, body }: { title: string; body: string }) {
  return (
    <header className="mx-auto max-w-3xl px-5 text-center">
      <h2 className="text-balance font-grotesk text-4xl font-medium leading-[1.05] md:text-6xl">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-landing-muted md:text-lg">{body}</p>
    </header>
  );
}

function ProductVisual({ image, alt, tone }: Pick<FeatureProps, "image" | "alt" | "tone">) {
  return (
    <div className={`relative min-h-[430px] overflow-hidden rounded-[28px] md:min-h-[590px] ${tones[tone]}`}>
      <div className="absolute inset-x-10 bottom-0 top-16 rounded-t-[42px] bg-landing-foreground p-[7px] shadow-landing-product md:inset-x-20 md:top-20">
        <img src={image} alt={alt} loading="lazy" className="h-full w-full rounded-t-[35px] object-cover object-top" />
      </div>
    </div>
  );
}

function FeatureRow({ title, body, image, alt, tone, reverse }: FeatureProps) {
  return (
    <section className="border-t border-landing-line bg-landing py-14 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2 md:gap-20 md:px-8"
      >
        <div className={reverse ? "md:order-2" : ""}>
          <h3 className="text-balance font-grotesk text-4xl font-medium leading-[1.05] md:text-5xl">{title}</h3>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-landing-muted md:text-lg">{body}</p>
          <Link to={APP_ENTRY} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
            {title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className={reverse ? "md:order-1" : ""}>
          <ProductVisual image={image} alt={alt} tone={tone} />
        </div>
      </motion.div>
    </section>
  );
}

export default function LandingBelow() {
  const { t } = useI18n();

  return (
    <main id="scopri" className="bg-landing text-landing-foreground">
      <section className="py-20 md:py-28">
        <SectionHeading title={t("sections.how.title")} body={t("sections.how.sub")} />
        <div className="mx-auto mt-14 max-w-5xl px-5 md:px-8">
          <ProductVisual image={appHome} alt={t("common.logoAlt")} tone="violet" />
        </div>
      </section>

      <FeatureRow
        title={t("terminology.bufferZeroTitle")}
        body={t("terminology.bufferZeroDesc")}
        image={appHome}
        alt={t("terminology.bufferZeroTitle")}
        tone="mint"
      />
      <FeatureRow
        reverse
        title={t("sections.money.title")}
        body={t("sections.money.sub")}
        image={appPurchase}
        alt={t("sections.money.title")}
        tone="gold"
      />
      <FeatureRow
        title={t("terminology.advisorTitle")}
        body={t("terminology.advisorDesc")}
        image={appOptional}
        alt={t("terminology.advisorTitle")}
        tone="blue"
      />
      <FeatureRow
        reverse
        title={t("showcase.risks.title")}
        body={t("showcase.risks.desc")}
        image={appRisks}
        alt={t("showcase.risks.title")}
        tone="violet"
      />

      <section className="bg-landing-soft py-20 md:py-28">
        <SectionHeading title={t("sections.sky.title")} body={t("sections.sky.sub")} />
        <div className="mx-auto mt-14 grid max-w-6xl gap-5 px-5 md:grid-cols-2 md:px-8">
          {[womanSky, peopleMountain].map((image, index) => (
            <div key={image} className="relative min-h-[420px] overflow-hidden rounded-[28px] md:min-h-[560px]">
              <img
                src={image}
                alt={index === 0 ? t("sections.sky.imgAlt") : t("sections.final.mountainAlt")}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-landing-overlay to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-landing md:p-10">
                <p className="font-grotesk text-3xl font-medium leading-tight md:text-4xl">
                  {index === 0 ? t("sections.sky.cardValue") : t("sections.final.sabbaticalValue")}
                </p>
                <p className="mt-2 text-sm opacity-80">
                  {index === 0 ? t("sections.sky.cardLabel") : t("sections.final.sabbaticalCardLabel")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-[560px] items-center justify-center bg-landing px-5 py-20 text-center">
        <div className="max-w-3xl">
          <img src={yearsLogo} alt="" className="mx-auto h-20 w-20 object-contain" />
          <h2 className="mt-5 text-balance font-grotesk text-4xl font-medium leading-[1.05] md:text-6xl">{t("sections.final.title")}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-landing-muted">{t("sections.final.sub")}</p>
          <Link
            to={APP_ENTRY}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-landing-accent px-8 py-4 text-sm font-semibold text-landing-accent-foreground transition-transform hover:scale-[1.03]"
          >
            {t("sections.final.cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-landing-line bg-landing px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 md:flex-row">
          <div className="flex items-center">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-12 w-12 object-contain" />
            <span className="-ml-3 font-cormorant text-3xl italic">ears</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-landing-muted">
            <Link to="/ubi" className="hover:text-landing-foreground">{t("footer.ubi")}</Link>
            <Link to="/privacy" className="hover:text-landing-foreground">{t("footer.privacy")}</Link>
            <Link to="/terms" className="hover:text-landing-foreground">{t("footer.terms")}</Link>
          </nav>
          <p className="text-xs text-landing-muted">© Years 2026</p>
        </div>
      </footer>
    </main>
  );
}