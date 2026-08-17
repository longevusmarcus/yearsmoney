import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { dictionary } from "@/i18n/dictionary";

type Block = { t: string; x: string };

/**
 * The UBI essay renders from the dictionary so both languages share one layout.
 * Block types: `lead` (emphasised paragraph), `p`, `h2`, `quote` (centred serif pull
 * quote), and `cards` (the two Life Buffer definitions).
 */
const UBI = () => {
  const { t, lang } = useI18n();
  const copy = dictionary[lang].ubi;
  const blocks = copy.blocks as Block[];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="fixed left-6 top-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.back}
        </Link>
      </div>

      {/* Hero */}
      <section className="px-6 pb-16 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-block rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground backdrop-blur-sm"
          >
            {copy.badge}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 font-display text-4xl text-foreground md:text-6xl"
          >
            {copy.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            {copy.sub}
          </motion.p>
        </div>
      </section>

      {/* Essay */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {blocks.map((block, i) => {
            if (block.t === "h2") {
              return (
                <motion.h2
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="pt-8 font-display text-2xl text-foreground"
                >
                  {block.x}
                </motion.h2>
              );
            }

            if (block.t === "quote") {
              return (
                <motion.p
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="py-6 text-center font-cormorant text-2xl italic text-foreground md:text-3xl"
                >
                  {block.x}
                </motion.p>
              );
            }

            if (block.t === "cards") {
              return (
                <div key={i} className="mt-8 grid gap-6 md:grid-cols-2">
                  {[
                    { h: copy.cardZeroTitle, b: copy.cardZeroBody },
                    { h: copy.cardOneTitle, b: copy.cardOneBody },
                  ].map((card) => (
                    <div
                      key={card.h}
                      className="rounded-2xl border border-border bg-card p-6 backdrop-blur-xl"
                    >
                      <h3 className="mb-2 font-display text-lg text-foreground">{card.h}</h3>
                      <p className="text-sm font-light leading-relaxed text-muted-foreground">
                        {card.b}
                      </p>
                    </div>
                  ))}
                </div>
              );
            }

            const isLead = block.t === "lead";
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={
                  isLead
                    ? "text-xl font-light leading-relaxed text-foreground"
                    : "text-lg font-light leading-relaxed text-muted-foreground"
                }
              >
                {block.x}
              </motion.p>
            );
          })}

          <div className="border-t border-border pt-12">
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link to="/privacy" className="transition-colors hover:text-foreground">
                {t("footer.privacy")}
              </Link>
              <Link to="/terms" className="transition-colors hover:text-foreground">
                {t("footer.terms")}
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{copy.copyright}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UBI;
