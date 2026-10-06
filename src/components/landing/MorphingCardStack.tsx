import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, LayoutGroup, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

export type LayoutMode = "stack" | "grid" | "list";

export interface CardData {
  id: string;
  kicker?: string;
  title: string;
  description: string;
  icon?: ReactNode;
}

export interface MorphingCardStackProps {
  cards?: CardData[];
  className?: string;
  defaultLayout?: LayoutMode;
  onCardClick?: (card: CardData) => void;
}

const SWIPE_THRESHOLD = 50;

export function MorphingCardStack({
  cards = [],
  className,
  defaultLayout = "grid",
  onCardClick,
}: MorphingCardStackProps) {
  const [layout] = useState<LayoutMode>(defaultLayout);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!cards || cards.length === 0) return null;

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;
    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }
    setIsDragging(false);
  };

  const getStackOrder = () => {
    const reordered: (CardData & { stackPosition: number })[] = [];
    for (let i = 0; i < cards.length; i++) {
      const index = (activeIndex + i) % cards.length;
      reordered.push({ ...cards[index], stackPosition: i });
    }
    return reordered.reverse();
  };

  const getLayoutStyles = (stackPosition: number) => {
    if (layout !== "stack") return { top: 0, left: 0, zIndex: 1, rotate: 0 };
    return {
      top: stackPosition * 14,
      left: stackPosition * 14,
      zIndex: cards.length - stackPosition,
      rotate: (stackPosition - 1) * 1.6,
    };
  };

  const containerStyles: Record<LayoutMode, string> = {
    stack: "relative mx-auto h-[23rem] w-full max-w-[19rem] sm:h-[21rem] sm:max-w-[24rem]",
    grid: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
    list: "flex flex-col",
  };

  const displayCards =
    layout === "stack" ? getStackOrder() : cards.map((c, i) => ({ ...c, stackPosition: i }));

  return (
    <div className={cn("w-full", className)}>
      <LayoutGroup>
        <motion.div layout className={containerStyles[layout]}>
          <AnimatePresence initial={false}>
            {displayCards.map((card) => {
              const styles = getLayoutStyles(card.stackPosition);
              const isExpanded = expandedCard === card.id;
              const isTopCard = layout === "stack" && card.stackPosition === 0;

              return (
                <motion.div
                  key={card.id}
                  layout
                  layoutId={`morph-card-${card.id}`}
                  initial={false}
                  animate={{
                    top: styles.top,
                    left: styles.left,
                    rotate: styles.rotate,
                    opacity: 1,
                  }}
                  style={{ zIndex: styles.zIndex }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  drag={isTopCard ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  whileDrag={{ scale: 1.02 }}
                  onClick={() => {
                    if (isDragging) return;
                    setExpandedCard(isExpanded ? null : card.id);
                    onCardClick?.(card);
                  }}
                  className={cn(
                    "cursor-pointer rounded-[4px] border border-border bg-card p-5 sm:p-7",
                    "transition-colors hover:border-foreground/25",
                    layout === "stack" &&
                      "absolute flex h-[21rem] w-[16rem] flex-col overflow-hidden sm:h-[19rem] sm:w-[22rem]",
                    layout === "stack" && isTopCard && "cursor-grab active:cursor-grabbing",
                    layout === "list" && "w-full rounded-none border-x-0 border-b-0 bg-transparent px-0 py-8 sm:px-0 sm:py-10",
                    isExpanded && "border-foreground/30",
                  )}
                >
                  <div
                    className={cn(
                      "min-h-0 transition-opacity duration-300",
                      layout === "list" && "grid grid-cols-[24px_1fr] items-start gap-5 md:grid-cols-[48px_1fr] md:gap-8",
                      layout === "stack" && !isTopCard && "opacity-0",
                    )}
                  >
                    {card.icon && (
                      <div className="flex h-8 w-6 shrink-0 items-center justify-start text-foreground/60 sm:h-11 sm:w-11">
                        {card.icon}
                      </div>
                    )}
                    <div className={cn(layout !== "list" && "mt-5 sm:mt-8")}>
                      {card.kicker && (
                        <div className="text-[10px] uppercase tracking-[0.18em] text-foreground/40 sm:text-[11px] sm:tracking-[0.22em]">
                          {card.kicker}
                        </div>
                      )}
                      <h3 className="mt-2 font-tight text-2xl font-light text-foreground sm:text-4xl">
                        {card.title}
                      </h3>
                      <p className="mt-2.5 max-w-2xl text-base leading-relaxed text-foreground/60 sm:mt-4 sm:text-lg">
                        {card.description}
                      </p>
                    </div>
                  </div>


                  {isTopCard && (
                    <div className="mt-auto pt-4 text-[10px] uppercase tracking-[0.2em] text-foreground/30">
                      Trascina per navigare
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {layout === "stack" && cards.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {cards.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Vai alla card ${index + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
