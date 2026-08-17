import { lazy, Suspense, useEffect, useState } from "react";
import { Hero } from "@/components/landing/Hero";

// Everything under the hero lives in its own chunk and is only requested once the
// hero has painted, so mobile first paint doesn't wait on the rest of the page.
const LandingBelow = lazy(() => import("./LandingBelow"));

export default function Landing() {
  const [showRest, setShowRest] = useState(false);

  useEffect(() => {
    // Wait for the browser to be idle after the hero paint before pulling the
    // heavier sections in.
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    if (idle) {
      const id = idle(() => setShowRest(true), { timeout: 1500 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(() => setShowRest(true), 300);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[oklch(0.09_0.01_260)] text-white">
      <Hero />
      {showRest && (
        <Suspense fallback={<div className="min-h-[50vh]" />}>
          <LandingBelow />
        </Suspense>
      )}
    </div>
  );
}
