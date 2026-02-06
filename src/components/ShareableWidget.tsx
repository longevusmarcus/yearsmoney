import { useRef } from "react";
import { motion } from "framer-motion";

interface ShareableWidgetProps {
  lifeBuffer: number;
  monthlyGain: number;
  displayMode: 'years' | 'months' | 'days';
  onClose?: () => void;
}

const ShareableWidget = ({ lifeBuffer, monthlyGain, displayMode, onClose }: ShareableWidgetProps) => {
  const widgetRef = useRef<HTMLDivElement>(null);

  const formatLifeBuffer = (months: number) => {
    if (displayMode === 'days') {
      const days = Math.round(months * 30);
      return { value: days.toLocaleString(), unit: 'days' };
    } else if (displayMode === 'months') {
      return { value: Math.round(months).toString(), unit: 'months' };
    } else {
      const years = months / 12;
      if (years >= 1) {
        return { value: years.toFixed(1), unit: 'years' };
      }
      return { value: Math.round(months).toString(), unit: 'months' };
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
      onClick={onClose}
    >
      <motion.div
        ref={widgetRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
      >
        {/* The shareable widget card */}
        <div className="bg-gradient-to-br from-card via-card to-muted/30 rounded-3xl p-8 border border-border/50 shadow-2xl">
          {/* Top accent line */}
          <div className="w-16 h-0.5 bg-gradient-to-r from-foreground/20 to-transparent mb-8" />
          
          {/* Main number */}
          <div className="mb-8">
            <p className="text-7xl font-extralight tracking-tight text-foreground leading-none">
              {formatted.value}
            </p>
            <p className="text-lg font-light text-muted-foreground mt-2 tracking-wide">
              {formatted.unit} of freedom
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50 mb-6" />

          {/* Monthly gain */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-foreground">
              +{monthlyFormatted.value}
            </span>
            <span className="text-sm text-muted-foreground font-light">
              {monthlyFormatted.unit}/month
            </span>
          </div>

          {/* Bottom branding */}
          <div className="mt-10 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Time Wealth
            </p>
            <p className="text-xs font-cursive italic text-muted-foreground/60">
              Years
            </p>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6 font-light">
          Screenshot to share your time wealth
        </p>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-sm text-muted-foreground font-light hover:text-foreground transition-colors"
        >
          Tap anywhere to close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ShareableWidget;
