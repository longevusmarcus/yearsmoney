import { useEffect, useState } from "react";
import { ArrowRight, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import yearsLogo from "@/assets/years-logo.webp";
import { APP_ENTRY } from "./appEntry";
import { useI18n } from "@/i18n/I18nProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/* Typing effect on the localised headline. The highlighted word comes from the
   dictionary too, so the gradient lands on the right word in each language. */
function TypedHeadline() {
  const { t } = useI18n();
  const full = t("hero.headline");
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="top" className="relative min-h-screen w-full overflow-hidden bg-black text-foreground">
      {/* Cinematic light-field background: soft diffuse blooms on pure black */}
      <LightLeakBackdrop />

      {/* Sticky glass pill navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed inset-x-0 top-2 z-50 px-4 md:top-3 md:px-8"
      >
        <nav
          className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border transition-all duration-300 ${
            scrolled
              ? "border-white/10 bg-[oklch(0.12_0.01_260/0.92)] px-4 py-1 shadow-[0_18px_60px_-24px_oklch(0_0_0/0.6)] backdrop-blur-xl md:px-5 md:py-1.5"
              : "border-transparent bg-transparent px-0 py-1.5 md:py-2"
          }`}
        >
          {/* Logo */}
          <a href="#top" className="flex items-center gap-0">
            <img
              src={yearsLogo}
              alt={t("common.logoAlt")}
              className={`object-contain transition-all duration-300 ${
                scrolled ? "h-9 w-9 md:h-10 md:w-10" : "h-10 w-10 md:h-11 md:w-11"
              }`}
            />
            <span
              className={`font-cormorant italic leading-none tracking-[0.02em] text-white transition-all duration-300 ${
                scrolled
                  ? "-ml-2.5 text-xl md:-ml-3 md:text-2xl"
                  : "-ml-3 text-2xl md:-ml-3 md:text-[1.7rem]"
              }`}
            >
              ears
            </span>
          </a>

          {/* Right-hand actions — visible on all screen sizes, no burger menu */}
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher />
            <Link
              to={APP_ENTRY}
              className="inline-flex items-center rounded-full bg-gradient-to-b from-white via-white/95 to-white/70 px-4 py-1.5 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95 md:px-5 md:py-1.5"
            >
              {t("nav.calculate")}
            </Link>
          </div>
        </nav>
      </motion.div>

      {/* Content container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pt-24 md:px-8 md:pt-28">
        {/* Hero section */}
        <div className="flex flex-1 flex-col items-center justify-center px-2 pt-6 pb-24 text-center md:pt-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-5 md:mb-6"
          >
            <Link
              to="/filosofia"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 text-xs text-white/80 backdrop-blur-md transition-colors hover:bg-white/10"
            >
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white">
                {t("hero.badgeChip")}
              </span>
              {t("hero.badge")}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mx-auto max-w-5xl font-grotesk text-5xl font-medium leading-[1.08] tracking-[-0.02em] text-white md:text-7xl lg:text-[5rem]"
          >
            <TypedHeadline />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-8 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg"
          >
            {t("hero.sub")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50"
          >
            {t("hero.subSecondary")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to={APP_ENTRY}
              className="inline-flex items-center rounded-full bg-gradient-to-b from-white via-white/95 to-white/70 px-8 py-3.5 text-sm font-medium text-black shadow-[0_10px_40px_-12px_rgba(255,255,255,0.5)] transition-transform hover:scale-105 active:scale-95"
            >
              {t("hero.ctaPrimary")}
            </Link>
            <a
              href="#scopri"
              onClick={(e) => scrollToSection(e, "scopri")}
              className="inline-flex items-center rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              {t("hero.ctaSecondary")}
            </a>
          </motion.div>
        </div>
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
