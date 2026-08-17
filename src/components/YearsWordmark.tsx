import yearsLogo from "@/assets/years-logo.webp";

/**
 * The YEARS lockup used in the onboarding header and `/calcola` — logo glyph plus the
 * wordmark in the display face. Kept in one place so the app header, the funnel, and the
 * simulator can't drift apart.
 */
export function YearsWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <img src={yearsLogo} alt="" className="h-7 w-7 shrink-0 object-contain" />
      <span className="font-display text-xs tracking-[0.28em] text-foreground/70">YEARS</span>
    </span>
  );
}

export default YearsWordmark;
