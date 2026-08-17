import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 10 },
  },
};

interface BentoGridShowcaseProps {
  integration: React.ReactNode;
  trackers: React.ReactNode;
  statistic: React.ReactNode;
  focus: React.ReactNode;
  productivity: React.ReactNode;
  shortcuts?: React.ReactNode;
  className?: string;
}

function MobileHorizontalScroll({ children }: { children: React.ReactNode[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"before" | "fixed" | "after">("before");
  const [translateX, setTranslateX] = useState(0);
  const [wrapperHeight, setWrapperHeight] = useState<string>("300vh");

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      const wrapperHeight = wrapper.offsetHeight;
      const viewportHeight = window.innerHeight;
      const horizontalDistance = Math.max(0, track.scrollWidth - window.innerWidth);
      const maxScroll = Math.max(1, wrapperHeight - viewportHeight);

      let progress = 0;
      let nextPhase: "before" | "fixed" | "after" = "before";

      if (rect.bottom < viewportHeight) {
        nextPhase = "after";
        progress = 1;
      } else if (rect.top <= 0) {
        nextPhase = "fixed";
        progress = Math.max(0, Math.min(1, -rect.top / maxScroll));
      } else {
        nextPhase = "before";
        progress = 0;
      }

      setPhase(nextPhase);
      setTranslateX(-progress * horizontalDistance);
    };

    const measure = () => {
      const horizontalDistance = Math.max(0, track.scrollWidth - window.innerWidth);
      setWrapperHeight(`${window.innerHeight + horizontalDistance}px`);
      update();
    };

    measure();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative md:hidden"
      style={{ height: wrapperHeight }}
      data-testid="mobile-horizontal-scroll"
    >
      <div
        className={cn(
          "left-0 h-screen w-full overflow-hidden flex items-center",
          phase === "before" && "absolute top-0",
          phase === "fixed" && "fixed top-0",
          phase === "after" && "absolute bottom-0",
        )}
      >
        <div
          ref={trackRef}
          className="flex h-full items-center gap-4 will-change-transform"
          style={{ transform: `translateX(${translateX}px)` }}
        >
          {children.map((child, i) => (
            <div key={i} className="h-[60vh] w-[85vw] shrink-0">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const BentoGridShowcase = ({
  integration,
  trackers,
  statistic,
  focus,
  productivity,
  shortcuts,
  className,
}: BentoGridShowcaseProps) => {
  return (
    <section className={cn("w-full", className)}>
      {/* Desktop grid */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className={cn(
          "hidden w-full md:grid",
          "grid-cols-1 gap-5 md:grid-cols-3",
          shortcuts ? "md:grid-rows-3" : "md:grid-rows-2",
          "auto-rows-[minmax(180px,auto)]",
        )}
      >
        <motion.div
          variants={itemVariants}
          className={cn("md:col-span-1", shortcuts ? "md:row-span-3" : "md:row-span-2")}
        >
          {integration}
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
          {trackers}
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
          {statistic}
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
          {focus}
        </motion.div>
        <motion.div variants={itemVariants} className="md:col-span-1 md:row-span-1">
          {productivity}
        </motion.div>

        {shortcuts && (
          <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-1">
            {shortcuts}
          </motion.div>
        )}
      </motion.section>

      {/* Mobile: vertical scroll drives horizontal card movement */}
      <div className="md:hidden">
        <div className="mb-5">{integration}</div>
        <MobileHorizontalScroll>
          {trackers}
          {statistic}
          {focus}
          {productivity}
        </MobileHorizontalScroll>
      </div>
    </section>
  );
};
