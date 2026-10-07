import { useEffect, useState } from "react";
import { ArrowRight, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import yearsLogo from "@/assets/years-logo.webp";
import heroImg from "@/assets/years-coast-hero.jpg";
import { APP_ENTRY } from "./appEntry";
import { useI18n } from "@/i18n/I18nProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/* Typing effect on the localised headline. The highlighted word comes from the
   dictionary too, so the gradient lands on the right word in each language. */
function TypedHeadline() {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  // "\n" in the dictionary marks the desktop line break; mobile wraps naturally
  const raw = t("hero.headline");
  const full = isMobile ? raw.replace(/\n/g, " ") : raw;
  const highlight = t("hero.headlineHighlight");
  const hlStart = full.indexOf(highlight);
  const hlEnd = hlStart >= 0 ? hlStart + highlight.length : -1;

  const [n, setN] = useState(0);

  // Restart the animation when the language changes
  useEffect(() => setN(0), [full]);

  useEffect(() => {
    if (n >= full.length) return;
    const pause = n === full.length ? 700 : 45;
    const id = window.setTimeout(() => setN((v) => v + 1), pause);
    return () => window.clearTimeout(id);
  }, [n, full.length]);

  const typed = full.slice(0, n);
  const before = hlStart < 0 ? typed : typed.slice(0, Math.min(n, hlStart));
  const mid = hlStart < 0 ? "" : typed.slice(Math.min(n, hlStart), Math.min(n, hlEnd));
  const after = hlStart < 0 ? "" : typed.slice(Math.min(n, hlEnd));

  return (
    <span>
      <span className="whitespace-pre-wrap">{before}</span>
      <span className="logo-gradient-text whitespace-pre-wrap">{mid}</span>
      <span className="whitespace-pre-wrap">{after}</span>
      <span
        aria-hidden
        className={`ml-1 inline-block h-[0.85em] w-[0.06em] translate-y-[0.06em] bg-white/70 align-middle ${
          n >= full.length ? "animate-pulse" : ""
        }`}
      />
    </span>
  );
}

/* Precise anchor scroll: re-corrects while in-view animations change layout */
function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  const go = () =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY,
      behavior: "smooth",
    });
  go();
  // layout shifts from reveal animations → snap exactly on target
  const t1 = window.setTimeout(go, 450);
  const t2 = window.setTimeout(() => {
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY,
      behavior: "auto",
    });
    window.clearTimeout(t1);
  }, 950);
  void t2;
}

const Hero = () => {
  const { t } = useI18n();
  const [qrOpen, setQrOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  // On phones the hero must be readable the instant the page paints.
  const d = (delay: number) => (isMobile ? 0 : delay);
  const dur = (duration: number) => (isMobile ? 0.35 : duration);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="top" className="relative min-h-[100svh] w-full overflow-hidden bg-black text-foreground">
      {/* Full-bleed cinematic media, Terafab-style */}
      <motion.img
        src={heroImg}
        alt=""
        aria-hidden
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />

      {/* Minimal nav: logo left, text links right; frosts on scroll */}
      <div
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-black/60 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-3 md:px-6">
          <a href="#top" className="flex items-center">
            <img src={yearsLogo} alt={t("common.logoAlt")} className="h-9 w-9 object-contain" />
            <span className="-ml-2.5 font-cormorant text-2xl italic leading-none text-white">ears</span>
          </a>
          <div className="flex items-center gap-4 text-sm md:gap-7">
            <LanguageSwitcher className="h-7 text-xs" />
            <Link to="/auth" className="text-white/60 transition-colors hover:text-white">
              {t("nav.join")}
            </Link>
            <Link to={APP_ENTRY} className="hidden text-white transition-opacity hover:opacity-70 md:inline">
              {t("nav.calculate")}
            </Link>
          </div>
        </nav>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1180px] flex-col justify-end px-5 pb-10 pt-28 md:px-6 md:pb-14">
        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur(0.9), delay: d(0.3), ease: [0.4, 0, 0.2, 1] }}
            className="font-tight text-[2.9rem] leading-[1.02] text-white md:text-[4.75rem]"
          >
            <TypedHeadline />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur(0.8), delay: d(0.5) }}
            className="mt-5 max-w-md font-tight text-xl leading-snug text-white/70 md:text-2xl"
          >
            {t("hero.sub")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur(0.8), delay: d(0.65) }}
            className="mt-9 flex flex-wrap items-center gap-2.5"
          >
            <Link
              to={APP_ENTRY}
              className="group inline-flex items-center gap-2 rounded-[3px] bg-white/90 px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-white"
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#scopri"
              onClick={(e) => scrollToSection(e, "scopri")}
              className="group inline-flex items-center gap-2 rounded-[3px] bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              {t("hero.ctaSecondary")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: d(0.9) }}
          className="mt-16 flex items-center justify-between gap-6 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.3em] text-white/50 md:mt-24"
        >
          <span>{t("hero.subSecondary")}</span>
        </motion.div>
      </div>
      <QrModal open={qrOpen} onClose={() => setQrOpen(false)} />
    </section>
  );
};

/**
 * LightLeakBackdrop
 * Cinematic, diagonally-drifting light-field on pure black. A mixed palette
 * of cool blue, violet, and warm orange/peach — echoing the sky section —
 * fused with heavy blur. Central darkening keeps typography readable.
 */
function LightLeakBackdrop() {
  // The drift repaints several very large blurred layers forever. That is fine on a
  // desktop GPU and ruinous on a phone, so mobile gets the same field, held still.
  const isMobile = useIsMobile();
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      {/* Diagonal drift wrapper — the whole light-field breathes gently */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={
          isMobile
            ? { opacity: 1 }
            : { opacity: 1, x: [0, 30, -10, 0], y: [0, -20, 10, 0] }
        }
        transition={
          isMobile
            ? { opacity: { duration: 1.8, ease: "easeOut" } }
            : {
                opacity: { duration: 1.8, ease: "easeOut" },
                x: { duration: 24, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 28, repeat: Infinity, ease: "easeInOut" },
              }
        }
        className="absolute inset-[-10%]"
      >
        {/* Violet-warm cluster — left: soft violet → peach */}
        <div
          className="absolute left-[-10%] top-[8%] h-[70vh] w-[70vw] rotate-[-18deg] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.80 0.14 280 / 0.50), oklch(0.74 0.16 295 / 0.42) 38%, oklch(0.80 0.15 55 / 0.26) 64%, transparent 80%)",
          }}
        />
        <div
          className="absolute left-[2%] top-[35%] h-[46vh] w-[46vw] rotate-[-8deg] rounded-full blur-[150px]"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.70 0.16 295 / 0.34), oklch(0.72 0.14 280 / 0.20) 55%, transparent 78%)",
          }}
        />

        {/* Sunset-violet cluster — right: peach → coral → soft violet */}
        <motion.div
          animate={isMobile ? undefined : { x: [0, -20, 15, 0], y: [0, 15, -8, 0] }}
          transition={
            isMobile
              ? undefined
              : {
                  x: { duration: 30, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 34, repeat: Infinity, ease: "easeInOut" },
                }
          }
          className="absolute right-[-15%] top-[-10%] h-[95vh] w-[85vw] rotate-[12deg] rounded-full blur-[170px]"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.90 0.13 55 / 0.52), oklch(0.78 0.16 45 / 0.38) 30%, oklch(0.60 0.17 300 / 0.28) 62%, oklch(0.55 0.18 30 / 0.20) 78%, transparent 90%)",
          }}
        />
        {/* Soft peach highlight — the "hot" core of the leak */}
        <div
          className="absolute right-[10%] top-[22%] h-[36vh] w-[36vw] rounded-full blur-[110px]"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.95 0.06 60 / 0.48), oklch(0.85 0.10 55 / 0.28) 45%, transparent 75%)",
          }}
        />
        {/* Deep violet anchor bottom-right */}
        <div
          className="absolute right-[5%] bottom-[-15%] h-[70vh] w-[70vw] rotate-[6deg] rounded-full blur-[190px]"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.40 0.18 300 / 0.44), oklch(0.55 0.15 290 / 0.24) 55%, transparent 78%)",
          }}
        />
      </motion.div>

      {/* Keep the center dark and clean for typography */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 55%, oklch(0 0 0 / 0.75), oklch(0 0 0 / 0.35) 50%, transparent 80%)",
        }}
      />

      {/* Fine grain — kills banding, adds analog feel */}
      <div
        className="absolute inset-0 opacity-[0.09] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      {/* Edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0_0_0/0.9))]" />
    </div>
  );
}

function QrModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const target =
    typeof window !== "undefined" ? `${window.location.origin}${APP_ENTRY}` : APP_ENTRY;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&data=${encodeURIComponent(
    target,
  )}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[oklch(0.12_0.01_260)] p-8 text-center shadow-[0_40px_120px_-20px_oklch(0.5_0.15_270/0.5)]"
          >
            <button
              onClick={onClose}
              aria-label={t("common.close")}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/80">
              <Smartphone className="h-3.5 w-3.5" />
              {t("hero.qrBadge")}
            </div>
            <h3 className="mt-5 font-grotesk text-2xl font-medium leading-tight text-white">
              {t("hero.qrTitle")}
            </h3>
            <p className="mt-2 text-sm text-white/60">
              {t("hero.qrSub")}
            </p>
            <div className="mt-6 flex items-center justify-center">
              <div className="rounded-2xl bg-white p-4">
                <img
                  src={qrUrl}
                  alt={t("hero.qrAlt")}
                  width={280}
                  height={280}
                  className="h-[280px] w-[280px]"
                />
              </div>
            </div>
            <div className="mt-5 truncate text-xs text-white/40">{target}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { Hero };
