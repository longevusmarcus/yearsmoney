import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import yearsLogo from "@/assets/years-logo.webp";
import womanSky from "@/assets/woman-sky.jpg";
import homeScreen from "@/assets/showcase-home.png";
import purchaseScreen from "@/assets/showcase-purchase-1.png";
import risksScreen from "@/assets/showcase-risks.png";
import leaderboardScreen from "@/assets/showcase-leaderboard.png";
import peopleMountain from "@/assets/people-mountain.jpg";
import testimonialOne from "@/assets/testimonial-1.png";
import testimonialTwo from "@/assets/testimonial-2.jpeg";
import testimonialThree from "@/assets/testimonial-3.jpeg";
import { Button } from "@/components/ui/button";
import { APP_ENTRY } from "@/components/landing/appEntry";
import { useI18n } from "@/i18n/I18nProvider";

const featureScreens = [homeScreen, purchaseScreen, risksScreen] as const;

export default function LandingBelow() {
  const { t, lang } = useI18n();
  const [activeStory, setActiveStory] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  const stories = lang === "it"
    ? ["La mia libertà", "Il mio prossimo acquisto", "Il rischio reale", "I miei obiettivi"]
    : ["My freedom", "My next purchase", "The real risk", "My goals"];

  const cards = [
    { title: t("showcase.buffer.title"), copy: t("showcase.buffer.desc") },
    { title: t("showcase.purchase.title"), copy: t("showcase.purchase.desc") },
    { title: t("showcase.risks.title"), copy: t("showcase.risks.desc") },
  ];

  const faqs = lang === "it"
    ? [
        ["Come funziona YEARS?", "Inserisci patrimonio, entrate e spese. YEARS li traduce in anni di libertà e ti mostra come ogni scelta cambia il tuo tempo."],
        ["I miei dati restano privati?", "Sì. I tuoi numeri servono a creare il tuo piano e puoi eliminarli dalle impostazioni quando vuoi."],
        ["Posso provare prima di creare un profilo?", "Sì. Il calcolatore iniziale ti permette di vedere subito la tua libertà in anni."],
        ["YEARS è disponibile anche da computer?", "Sì. Puoi usare l’esperienza completa sia da telefono sia da computer."],
      ]
    : [
        ["How does YEARS work?", "Add your wealth, income and expenses. YEARS turns them into years of freedom and shows how each choice changes your time."],
        ["Is my data private?", "Yes. Your numbers are used to build your plan, and you can delete them from settings at any time."],
        ["Can I try it before creating a profile?", "Yes. The opening calculator shows your freedom in years right away."],
        ["Can I use YEARS on desktop?", "Yes. The full experience works on both phones and computers."],
      ];

  return (
    <main className="years-chapters-shell years-below">
      <section id="scopri" className="years-crop">
        <header className="years-heading-block years-heading-flush">
          <p className="years-eyebrow">{lang === "it" ? "LA TUA VITA, ADESSO" : "YOUR LIFE, NOW"}</p>
          <h2>{lang === "it" ? "Guarda il tuo futuro prendere forma." : "Watch your future take shape."}</h2>
        </header>

        <div className="years-story-panel">
          <img src={womanSky} alt={t("sections.sky.imgAlt")} className="years-story-backdrop" />
          <div className="years-story-shade" />
          <div className="years-story-copy">
            <img src={yearsLogo} alt="" />
            <p>{stories[activeStory]}</p>
            <strong>{activeStory === 0 ? "6a 7m" : activeStory === 1 ? "18 giorni" : activeStory === 2 ? "0,59 anni" : "11a 2m"}</strong>
          </div>
          <img src={[homeScreen, purchaseScreen, risksScreen, leaderboardScreen][activeStory]} alt="" className="years-story-phone" />
          <div className="years-story-chips" role="radiogroup" aria-label={lang === "it" ? "Scegli una vista" : "Choose a view"}>
            {stories.map((story, index) => (
              <Button
                key={story}
                type="button"
                variant={index === activeStory ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveStory(index)}
                aria-pressed={index === activeStory}
              >
                {story}
              </Button>
            ))}
          </div>
        </div>
        <div className="years-crop-cta"><Button asChild size="lg"><Link to={APP_ENTRY}>{t("hero.ctaPrimary")}</Link></Button></div>
      </section>

      <section id="come-funziona" className="years-how">
        <header className="years-heading-block">
          <p className="years-eyebrow">{lang === "it" ? "COME FUNZIONA" : "HOW IT WORKS"}</p>
          <h2>{lang === "it" ? "Il denaro aspetta di essere speso. YEARS ti mostra prima il tempo." : "Money waits to be spent. YEARS shows you the time first."}</h2>
          <p className="years-lede">{t("sections.how.sub")}</p>
        </header>

        <div className="years-cards">
          {cards.map((card, index) => (
            <article className="years-card" key={card.title}>
              <span className="years-card-badge">{index + 1}</span>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
              <div className="years-card-screen"><img src={featureScreens[index]} alt="" /></div>
            </article>
          ))}
        </div>
      </section>

      <section id="community" className="years-proof">
        <div className="years-inner">
          <p className="years-eyebrow">COMMUNITY</p>
          <h2>{lang === "it" ? "La ricchezza si misura meglio insieme." : "Wealth is better measured together."}</h2>
          <div className="years-stats">
            <div><strong>6a 7m</strong><span>{lang === "it" ? "libertà media" : "average freedom"}</span></div>
            <div><strong>+227h</strong><span>{lang === "it" ? "tempo guadagnato" : "time gained"}</span></div>
            <div><strong>100%</strong><span>{lang === "it" ? "centrato sulla vita" : "life-first"}</span></div>
          </div>
          <div className="years-people">
            {[testimonialOne, testimonialTwo, testimonialThree].map((src, index) => (
              <div key={src}><img src={src} alt="" /><span>{["Marco", "Sofia", "Aisha"][index]}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="years-campaign">
        <img src={peopleMountain} alt={t("sections.final.mountainAlt")} />
        <div className="years-campaign-shade" />
        <div className="years-campaign-copy">
          <p className="years-eyebrow">YEARS, {lang === "it" ? "OVUNQUE" : "EVERYWHERE"}</p>
          <h2>{t("sections.final.title")}</h2>
          <Button asChild size="lg"><Link to={APP_ENTRY}>{t("sections.final.cta")}</Link></Button>
        </div>
      </section>

      <section id="faq" className="years-faq">
        <div className="years-inner">
          <p className="years-eyebrow">FAQ</p>
          <h2>{lang === "it" ? "Domande frequenti" : "Frequently asked"}</h2>
          <div className="years-faq-list">
            {faqs.map(([question, answer], index) => (
              <div className="years-faq-item" key={question}>
                <Button type="button" variant="ghost" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}>
                  <span>{question}</span><ChevronDown className={openFaq === index ? "rotate-180" : ""} />
                </Button>
                {openFaq === index ? <p>{answer}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="years-footer">
        <div className="years-footer-brand">
          <a href="#top" className="years-wordmark"><img src={yearsLogo} alt="" /><span>ears</span></a>
          <p>{lang === "it" ? "Il compagno che traduce il denaro in tempo." : "The companion that turns money into time."}</p>
        </div>
        <nav>
          <div><h3>{lang === "it" ? "Prodotto" : "Product"}</h3><Link to={APP_ENTRY}>{t("nav.calculate")}</Link><a href="#come-funziona">{lang === "it" ? "Come funziona" : "How it works"}</a></div>
          <div><h3>Years</h3><Link to="/filosofia">{lang === "it" ? "Filosofia" : "Philosophy"}</Link><Link to="/ubi">UBI</Link></div>
          <div><h3>{lang === "it" ? "Legale" : "Legal"}</h3><Link to="/privacy">{t("footer.privacy")}</Link><Link to="/terms">{t("footer.terms")}</Link></div>
        </nav>
        <div className="years-footer-bottom"><span>{t("footer.tagline")}</span><span>years.money</span></div>
      </footer>
    </main>
  );
}
