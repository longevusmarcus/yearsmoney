import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import html2canvas from "html2canvas";
import { useI18n } from "@/i18n/I18nProvider";

interface ShareableWidgetProps {
  lifeBuffer: number;
  monthlyGain: number;
  displayMode: 'years' | 'months' | 'days';
  onClose?: () => void;
}

const INTRO_DURATION = 2400;

const ShareableWidget = ({ lifeBuffer, monthlyGain, displayMode, onClose }: ShareableWidgetProps) => {
  const { t } = useI18n();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // Wrapped-style story: two intro beats, then the shareable card.
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 2) return;
    const timer = setTimeout(() => setStep((s) => s + 1), INTRO_DURATION);
    return () => clearTimeout(timer);
  }, [step]);


  const formatLifeBuffer = (months: number) => {
    if (displayMode === 'days') {
      const days = Math.round(months * 30);
      return { value: days.toLocaleString(), unit: t("app.share.unitDays") };
    } else if (displayMode === 'months') {
      return { value: Math.round(months).toString(), unit: t("app.share.unitMonths") };
    } else {
      const years = months / 12;
      if (years >= 1) {
        return { value: years.toFixed(1), unit: t("app.share.unitYears") };
      }
      return { value: Math.round(months).toString(), unit: t("app.share.unitMonths") };
    }
  };

  const handleDownload = async () => {
    if (!widgetRef.current) return;
    
    setIsDownloading(true);
    
    // Small delay to ensure buttons are hidden
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const canvas = await html2canvas(widgetRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = 'time-wealth.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatted = formatLifeBuffer(lifeBuffer);
  const monthlyFormatted = formatLifeBuffer(monthlyGain);
  const yearlyFormatted = formatLifeBuffer(monthlyGain * 12);
  const daysFree = Math.round(lifeBuffer * 30).toLocaleString();

  const introSlides = [
    { title: t("app.share.intro1Title"), sub: t("app.share.intro1Sub") },
    { title: t("app.share.intro2Title"), sub: t("app.share.intro2Sub") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      onClick={() => step < 2 && setStep((s) => s + 1)}
    >
      {/* Story progress bars */}
      <div className="absolute left-6 right-6 top-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/15">
            <motion.div
              className="h-full bg-foreground/80"
              initial={false}
              animate={{ width: step > i ? "100%" : step === i ? "100%" : "0%" }}
              transition={{ duration: step === i && i < 2 ? INTRO_DURATION / 1000 : 0.2, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step < 2 ? (
          <motion.div
            key={`intro-${step}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm text-center"
          >
            <h2 className="font-display text-4xl leading-tight text-foreground whitespace-pre-line">
              {introSlides[step].title}
            </h2>
            <p className="mt-5 text-base text-muted-foreground">{introSlides[step].sub}</p>
            <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/50">
              {t("app.share.tapToContinue")}
            </p>
          </motion.div>
        ) : (
      <motion.div
        key="card"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
        className="w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Wrapped-style share card.
            html2canvas-safe: sRGB hex only, no oklch, no backdrop-filter,
            no background-clip:text. Stripes are real elements. */}
        <div
          ref={widgetRef}
          className="relative overflow-hidden rounded-[28px] shadow-2xl"
          style={{ backgroundColor: "#0d0d10" }}
        >
          {/* Top panel — bold accent block */}
          <div className="relative overflow-hidden px-7 pb-8 pt-7" style={{ backgroundColor: "#fbdd67" }}>
            {/* striped frame accent */}
            <div
              aria-hidden
              className="absolute inset-y-0 right-0 w-10"
              style={{
                background:
                  "repeating-linear-gradient(135deg, #0d0d10 0px, #0d0d10 7px, #fbdd67 7px, #fbdd67 14px)",
              }}
            />
            <div
              aria-hidden
              className="absolute left-0 top-0 h-10 w-full"
              style={{
                background:
                  "repeating-linear-gradient(135deg, #823feb 0px, #823feb 7px, #fbdd67 7px, #fbdd67 14px)",
              }}
            />

            <div className="relative mt-12 pr-12">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: "#0d0d10" }}
              >
                {t("app.share.wrapped")}
              </p>
              <p
                className="font-display text-[5.5rem] tracking-tight"
                style={{ color: "#0d0d10", lineHeight: 1.02 }}
              >
                {formatted.value}
              </p>
              <p
                className="text-xl font-semibold"
                style={{ color: "#0d0d10", lineHeight: 1.3 }}
              >
                {formatted.unit} {t("app.share.ofFreedom")}
              </p>
            </div>
          </div>

          {/* Bottom stats — Wrapped two-column list */}
          <div className="px-7 pb-6 pt-7">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {[
                { label: t("app.share.statFreedom"), value: `${formatted.value} ${formatted.unit}` },
                { label: t("app.share.statDaysFree"), value: daysFree },
                {
                  label: t("app.share.statPerMonth"),
                  value: `+${monthlyFormatted.value} ${monthlyFormatted.unit}`,
                },
                {
                  label: t("app.share.statPerYear"),
                  value: `+${yearlyFormatted.value} ${yearlyFormatted.unit}`,
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="font-display text-2xl"
                    style={{ color: "#f9f7fe", lineHeight: 1.25 }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer branding */}
            <div className="mt-8 flex items-center justify-between">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {t("app.share.timeWealth")}
              </p>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#fbdd67" }}
              >
                YEARS.MONEY
              </p>
            </div>
          </div>
        </div>


        {/* Action buttons */}
        {!isDownloading && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleDownload}
              className="p-2 text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label={t("app.share.download")}
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label={t("app.share.close")}
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ShareableWidget;
