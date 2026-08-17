import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { dictionary } from "@/i18n/dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Chapter = { chapter: string; title: string; body: string[] };

export default function Filosofia() {
  const { t, lang } = useI18n();
  const chapters = dictionary[lang].filosofia.chapters as Chapter[];
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const total = chapters.length;

  const go = (d: number) => {
    const next = page + d;
    if (next < 0 || next >= total) return;
    setDir(d);
    setPage(next);
  };

  const current = chapters[page];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.09_0.01_260)] text-white">
      {/* Ambient gradient blooms */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-[10%] h-[520px] w-[520px] rounded-full bg-[oklch(0.72_0.19_55/0.18)] blur-[160px]" />
        <div className="absolute top-1/3 right-[8%] h-[560px] w-[560px] rounded-full bg-[oklch(0.55_0.24_295/0.18)] blur-[160px]" />
        <div className="absolute bottom-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[oklch(0.70_0.16_180/0.15)] blur-[150px]" />
      </div>

      {/* Top bar */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 md:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80 backdrop-blur-md transition-colors hover:bg-white/10"
        >
          <Home className="h-3.5 w-3.5" />
          {t("filosofia.home")}
        </Link>
        <span className="ml-auto font-grotesk text-right text-[9px] uppercase tracking-[0.3em] text-white/40 md:ml-0 md:text-[10px] md:tracking-[0.4em]">
          {t("filosofia.tagline")}
        </span>
        <LanguageSwitcher />
        <span className="hidden font-cormorant text-xs text-white/50 md:inline">
          {String(page + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Book */}
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-6 md:px-8">
        <div className="relative w-full" style={{ perspective: "2200px" }}>
          <div className="relative mx-auto w-full max-w-3xl min-h-[540px] md:min-h-[820px]">
            {/* Book shell */}
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[oklch(0.18_0.02_60)] via-[oklch(0.14_0.02_50)] to-[oklch(0.10_0.02_45)] shadow-[0_60px_160px_-40px_oklch(0.5_0.15_60/0.5)]" />
            <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />
            {/* Spine seam */}
            <div className="pointer-events-none absolute top-6 bottom-6 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />

            {/* Page */}
            <div className="absolute inset-4 md:inset-6">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.article
                  key={page}
                  custom={dir}
                  initial={{
                    rotateY: dir > 0 ? 75 : -75,
                    opacity: 0,
                    transformOrigin: dir > 0 ? "left center" : "right center",
                  }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{
                    rotateY: dir > 0 ? -75 : 75,
                    opacity: 0,
                    transformOrigin: dir > 0 ? "right center" : "left center",
                  }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex h-full w-full flex-col rounded-[20px] bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.02_85)_0%,_oklch(0.92_0.03_80)_60%,_oklch(0.86_0.04_75)_100%)] px-7 py-7 text-[oklch(0.22_0.03_45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),_inset_0_-30px_60px_rgba(120,80,20,0.08)] md:px-16 md:py-16"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Paper grain */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[20px] opacity-[0.15] mix-blend-multiply"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 30%, rgba(120,80,20,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(90,60,10,0.35), transparent 45%)",
                    }}
                  />
                  {/* Decorative header */}
                  <div className="flex items-center gap-4">
                    <span className="h-px flex-1 bg-[oklch(0.22_0.03_45/0.25)]" />
                    <span className="font-grotesk text-[10px] uppercase tracking-[0.5em] text-[oklch(0.35_0.06_50)]">
                      {current.chapter}
                    </span>
                    <span className="h-px flex-1 bg-[oklch(0.22_0.03_45/0.25)]" />
                  </div>

                  {current.title && (
                    <h1 className="mt-6 font-cormorant text-center text-4xl italic leading-[1.05] md:mt-10 md:text-6xl">
                      {current.title}
                    </h1>
                  )}

                  <div className="mx-auto mt-5 h-px w-24 bg-[oklch(0.22_0.03_45/0.35)] md:mt-8" />

                  <div className="mx-auto mt-6 max-w-xl space-y-5 font-cormorant text-center text-lg leading-[1.65] md:mt-10 md:space-y-6 md:text-2xl md:leading-[1.55]">
                    {current.body.map((line, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.12, duration: 0.6 }}
                      >
                        {line}
                      </motion.p>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 md:pt-10" />
                </motion.article>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={() => go(-1)}
            disabled={page === 0}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-md transition-all hover:bg-white/10 disabled:opacity-30"
            aria-label={t("filosofia.prevPage")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {chapters.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDir(i > page ? 1 : -1);
                  setPage(i);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === page ? "w-8 bg-white" : "w-2 bg-white/25 hover:bg-white/50"
                }`}
                aria-label={`${t("filosofia.goToPage")} ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            disabled={page === total - 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-md transition-all hover:bg-white/10 disabled:opacity-30"
            aria-label={t("filosofia.nextPage")}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {page === total - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:-translate-y-0.5"
            >
              {t("filosofia.backToSimulator")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
