import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, X } from "lucide-react";
import html2canvas from "html2canvas";
import { useI18n } from "@/i18n/I18nProvider";

interface ShareableWidgetProps {
  lifeBuffer: number;
  monthlyGain: number;
  displayMode: 'years' | 'months' | 'days';
  onClose?: () => void;
}

const ShareableWidget = ({ lifeBuffer, monthlyGain, displayMode, onClose }: ShareableWidgetProps) => {
  const { t } = useI18n();
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
        className="w-full max-w-sm"
      >
        {/* The shareable widget card.
            Everything here is kept html2canvas-safe: sRGB hex instead of oklch, no
            backdrop-filter, and no background-clip:text — html2canvas renders none of
            those, and the download is the whole point of this card. The YEARS ramp is
            carried by real gradient elements instead. */}
        <div
          ref={widgetRef}
          className="relative overflow-hidden rounded-3xl border border-white/10 p-8 shadow-2xl"
          style={{ backgroundColor: "#08080b" }}
        >
          {/* Ambient blooms, echoing the app's background field */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(251,124,0,0.22), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-12 h-64 w-64 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(130,63,235,0.26), transparent 70%)" }}
          />

          <div className="relative">
            {/* Top accent line — the violet-to-gold ramp */}
            <div
              className="mb-8 h-0.5 w-16 rounded-full"
              style={{ background: "linear-gradient(90deg, #823feb, #ff992b)" }}
            />

            {/* Main number */}
            <div className="mb-8">
              {/* Explicit line-height: html2canvas lays out `leading-none` tighter than the
                  browser does, which collapsed the gap to the label in the exported PNG. */}
              <p
                className="font-display text-7xl tracking-tight"
                style={{ color: "#f9f7fe", lineHeight: 1.12 }}
              >
                {formatted.value}
              </p>
              <p
                className="mt-3 text-lg font-light tracking-wide"
                style={{ color: "#fbdd67", lineHeight: 1.4 }}
              >
                {formatted.unit} {t("app.share.ofFreedom")}
              </p>
            </div>

            {/* Divider */}
            <div className="mb-6 h-px" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />

            {/* Monthly gain */}
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl" style={{ color: "#c97dfc" }}>
                +{monthlyFormatted.value}
              </span>
              <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.45)" }}>
                {monthlyFormatted.unit}{t("app.share.perMonth")}
              </span>
            </div>

            {/* Bottom branding */}
            <div className="mt-10 flex items-center justify-between">
              <p
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                {t("app.share.timeWealth")}
              </p>
              <p
                className="font-cormorant text-base italic"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Years
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
