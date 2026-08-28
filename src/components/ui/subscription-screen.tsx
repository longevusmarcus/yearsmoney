import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SubscriptionFeature {
  icon: React.ReactNode;
  text: string;
}

export interface PricingOption {
  id: string;
  price: string;
  period: string;
  badge?: string;
}

export interface SubscriptionScreenProps {
  /** Mascot / hero artwork shown above the title. */
  headerImageSrc: string;
  appName: string;
  planType: string;
  title?: string;
  features: SubscriptionFeature[];
  pricingOptions: PricingOption[];
  defaultPlanId: string;
  subscribeButtonText: string;
  footerText: string;
  closeLabel?: string;
  onClose: () => void;
  onSubscribe: (planId: string) => void;
}

/**
 * Full-screen paywall in the YEARS visual language: black glass surface, gold
 * accent (`#fbdd67` → `primary`), Cormorant display type and the bear mascot
 * bouncing on top. Colours come from design tokens only.
 */
export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  headerImageSrc,
  appName,
  planType,
  title,
  features,
  pricingOptions,
  defaultPlanId,
  subscribeButtonText,
  footerText,
  closeLabel = "Close",
  onClose,
  onSubscribe,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-background/95 p-5 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
    >
      {/* ambient blooms */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-[-10%] h-[320px] w-[320px] rounded-full bg-[oklch(0.72_0.19_55/0.18)] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[360px] w-[360px] rounded-full bg-[oklch(0.55_0.24_295/0.20)] blur-[130px]" />
      </div>

      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-border/60 bg-card/80 px-6 pb-6 pt-5 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {/* Mascot */}
        <div className="flex justify-center">
          <motion.img
            src={headerImageSrc}
            alt=""
            draggable={false}
            initial={{ y: 16, rotate: -12, opacity: 0 }}
            animate={{ y: [0, -12, 0], rotate: [-8, 8, -8], opacity: 1 }}
            transition={{
              y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.4 },
            }}
            className="h-24 w-24 object-contain"
          />
        </div>

        {/* Title */}
        <div className="mt-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            {appName} {planType}
          </p>
          {title && (
            <h2 className="mt-2 font-display text-[2rem] leading-tight text-foreground">{title}</h2>
          )}
        </div>

        {/* Features */}
        <ul className="mt-6 space-y-3">
          {features.map((feature) => (
            <li key={feature.text} className="flex items-start gap-3">
              <span className="mt-0.5 text-primary">{feature.icon}</span>
              <span className="text-sm leading-snug text-muted-foreground">{feature.text}</span>
            </li>
          ))}
        </ul>

        {/* Pricing */}
        <div className="mt-7 space-y-2.5">
          {pricingOptions.map((option) => {
            const active = selectedPlan === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPlan(option.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border/60 bg-background/40 hover:border-border",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    active ? "border-primary bg-primary" : "border-muted-foreground/40",
                  )}
                >
                  {active && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="font-display text-xl text-foreground">{option.price}</span>
                  <span className="ml-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {option.period}
                  </span>
                </span>
                {option.badge && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                    {option.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onSubscribe(selectedPlan)}
          className="mt-6 w-full rounded-2xl bg-primary py-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          {subscribeButtonText}
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">{footerText}</p>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionScreen;
