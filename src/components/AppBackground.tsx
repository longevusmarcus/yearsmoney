/**
 * The ambient field every in-app screen sits on — the same black + three blurred
 * colour blooms used by the onboarding flow (`src/pages/Onboarding.tsx`) and
 * `/calcola`, so the app and the funnel read as one product.
 *
 * Rendered once from `App.tsx` as a fixed layer behind everything. App screens use
 * `bg-transparent` on their root so this shows through; the landing page paints its
 * own opaque sections over it.
 *
 * In light mode the blooms are dimmed via `.light .years-ambient` in `index.css`.
 */
export function AppBackground() {
  return (
    <div aria-hidden className="years-ambient pointer-events-none fixed inset-0 -z-10 bg-background">
      <div className="absolute -top-24 left-[-10%] h-[420px] w-[420px] rounded-full bg-[oklch(0.72_0.19_55/0.20)] blur-[120px]" />
      <div className="absolute top-1/2 right-[-15%] h-[520px] w-[520px] rounded-full bg-[oklch(0.55_0.24_295/0.20)] blur-[140px]" />
      <div className="absolute bottom-[-10%] left-1/4 h-[360px] w-[360px] rounded-full bg-[oklch(0.70_0.16_180/0.14)] blur-[120px]" />
    </div>
  );
}

export default AppBackground;
