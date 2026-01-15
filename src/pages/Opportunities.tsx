import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Plane,
  Laptop,
  BookOpen,
  Dumbbell,
  Coffee,
  Info,
  ExternalLink,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { ProductSkeletonList } from "@/components/ProductCardSkeleton";
import { PageHeader } from "@/components/PageHeader";
import MobileOnly from "@/components/MobileOnly";

interface Product {
  title: string;
  price: number;
  description?: string;
  affiliateUrl?: string;
  roi?: string;
  source?: string;
  category?: string;
  workingDays?: number;
  workingMonths?: number;
  workingYears?: number;
}

const iconMap: Record<string, any> = {
  travel: Plane,
  tech: Laptop,
  learning: BookOpen,
  fitness: Dumbbell,
  lifestyle: Coffee,
  default: Sparkles,
};

const Opportunities = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("tech");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's financial data
  const income = Number(localStorage.getItem("tc_income")) || 0;
  const expenses = Number(localStorage.getItem("tc_expenses")) || 0;
  const netWorth = Number(localStorage.getItem("tc_networth")) || 0;

  const freeCash = income - expenses;
  const hasData = income > 0 && expenses > 0;
  const hasNetWorth = netWorth > 0;

  // CORE CALCULATIONS
  const WORKING_DAYS_PER_MONTH = 22;
  const WORKING_DAYS_PER_YEAR = WORKING_DAYS_PER_MONTH * 12;
  const dailyEarnings = freeCash > 0 ? freeCash / WORKING_DAYS_PER_MONTH : 45; // Default fallback

  // Your "optional life" - yearly buffer capacity
  const yearlyBufferDays = freeCash > 0 ? (freeCash * 12) / dailyEarnings : 264;
  const yearlyBufferMonths = yearlyBufferDays / WORKING_DAYS_PER_MONTH;
  const yearlyBufferYears = yearlyBufferDays / WORKING_DAYS_PER_YEAR;

  // Current life buffer
  const currentBufferMonths = expenses > 0 ? netWorth / expenses : 0;

  const calculateTimeEquivalents = (priceValue: number) => {
    const workingDays = priceValue / dailyEarnings;
    const workingMonths = workingDays / WORKING_DAYS_PER_MONTH;
    const workingYears = workingDays / WORKING_DAYS_PER_YEAR;
    const percentOfYearlyBuffer = (workingDays / yearlyBufferDays) * 100;

    return {
      workingDays,
      workingMonths,
      workingYears,
      percentOfYearlyBuffer,
    };
  };

  const categories = [
    { id: "tech", label: "Tech", icon: Laptop },
    { id: "travel", label: "Travel", icon: Plane },
    { id: "learning", label: "Learning", icon: BookOpen },
    { id: "fitness", label: "Fitness", icon: Dumbbell },
    { id: "lifestyle", label: "Lifestyle", icon: Coffee },
  ];

  // Fetch products when category changes
  const fetchProducts = async (category: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ category }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch products");
      }

      // Enrich products with time calculations
      const enrichedProducts = (data.products || []).map((product: any) => {
        const timeEquiv = calculateTimeEquivalents(product.price);
        return {
          ...product,
          workingDays: timeEquiv.workingDays,
          workingMonths: timeEquiv.workingMonths,
          workingYears: timeEquiv.workingYears,
        };
      });

      setProducts(enrichedProducts);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  // Format time display
  const formatTime = (product: Product) => {
    if (!product.workingDays) return "—";

    if (product.workingDays >= WORKING_DAYS_PER_YEAR) {
      return `${product.workingYears?.toFixed(1)}y`;
    } else if (product.workingDays >= WORKING_DAYS_PER_MONTH) {
      return `${product.workingMonths?.toFixed(1)}mo`;
    } else {
      return `${product.workingDays?.toFixed(1)}d`;
    }
  };

  const formatFullTime = (product: Product) => {
    if (!product.workingDays) return "";

    const parts = [];
    if (product.workingYears && product.workingYears >= 0.1) {
      parts.push(`${product.workingYears.toFixed(2)} years`);
    }
    if (product.workingMonths && product.workingMonths >= 0.1) {
      parts.push(`${product.workingMonths.toFixed(1)} months`);
    }
    parts.push(`${product.workingDays.toFixed(0)} days`);

    return parts.join(" • ");
  };

  return (
    <MobileOnly>
      <div className="min-h-screen bg-background text-foreground pb-28">
        {/* Header */}
        <PageHeader title="Ideas" subtitle="See what your time could buy (optional life)" />

        {/* Warning if no data */}
        {!hasData && (
          <div className="px-6 mb-4">
            <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground font-light">
                Add your income and expenses on the Home page for personalized time costs.
              </p>
            </div>
          </div>
        )}

        {/* Your Optional Life Summary */}
        <div className="px-6 py-4">
          <div className="bg-foreground text-background rounded-2xl p-5">
            <p className="text-xs opacity-60 font-light">Your yearly buffer capacity</p>
            <div className="flex items-baseline gap-3 mt-1">
              <p className="text-4xl font-light">{Math.round(yearlyBufferDays)}</p>
              <p className="text-lg opacity-80">days</p>
            </div>

            {/* Time equivalents */}
            <div className="flex gap-4 mt-3 text-sm opacity-80">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{yearlyBufferMonths.toFixed(1)} months</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{yearlyBufferYears.toFixed(2)} years</span>
              </div>
            </div>

            <p className="text-xs opacity-60 mt-3 font-light">
              Earning ${dailyEarnings.toFixed(0)}/day toward your buffer
            </p>
            <p className="text-[10px] opacity-40 mt-1 font-light">
              (${freeCash.toLocaleString()}/mo surplus ÷ {WORKING_DAYS_PER_MONTH} working days × 12 months)
            </p>

            {/* Current buffer status */}
            {hasNetWorth && (
              <div className="mt-4 pt-3 border-t border-background/20">
                <div className="flex justify-between text-xs">
                  <span className="opacity-60">Current life buffer</span>
                  <span className="font-medium">{currentBufferMonths.toFixed(1)} months</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="px-6 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-light whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id ? "bg-foreground text-background" : "bg-card border border-border"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Affiliate disclaimer */}
        <div className="px-6 py-2">
          <p className="text-[10px] text-muted-foreground font-light flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Links may include affiliate partnerships. Prices are estimates.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && <ProductSkeletonList />}

        {/* Error state */}
        {error && !isLoading && (
          <div className="px-6 py-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4">
              <p className="text-sm text-destructive font-light">{error}</p>
              <button
                onClick={() => fetchProducts(selectedCategory)}
                className="mt-3 flex items-center gap-2 text-xs text-destructive underline"
              >
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            </div>
          </div>
        )}

        {/* Products list */}
        {!isLoading && !error && (
          <div className="px-6 py-4">
            <div className="space-y-3">
              {products.map((product, index) => {
                const Icon = iconMap[product.category || selectedCategory] || iconMap.default;
                const percentOfBudget =
                  yearlyBufferDays > 0 && product.workingDays ? (product.workingDays / yearlyBufferDays) * 100 : 0;

                return (
                  <motion.a
                    key={index}
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="block bg-card border border-border rounded-2xl p-4 hover:border-foreground/30 transition-colors"
                  >
                    {/* Top row: Icon + Title/Price + Time */}
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-light truncate pr-2">{product.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                ${product.price?.toLocaleString()}
                              </span>
                              {product.source && <span className="text-[10px] text-primary">{product.source}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-light">{formatTime(product)}</p>
                            {yearlyBufferDays > 0 && (
                              <p className="text-[9px] text-muted-foreground">{percentOfBudget.toFixed(0)}% of year</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-[11px] text-muted-foreground/80 font-light mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {/* Time breakdown */}
                    <p className="text-[9px] text-muted-foreground/60 font-light mt-2">{formatFullTime(product)}</p>

                    {/* Footer: ROI + View */}
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-3">
                      {product.roi ? (
                        <p className="text-[9px] text-muted-foreground font-light truncate flex-1 min-w-0">
                          {product.roi}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="text-[10px] text-primary flex items-center gap-1 shrink-0">
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {!isLoading && !error && products.length > 0 && (
          <div className="px-6 py-4">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground font-light">
                These {products.length} options would cost{" "}
                <span className="font-medium text-foreground">
                  {products.reduce((sum, p) => sum + (p.workingDays || 0), 0).toFixed(0)} working days
                </span>{" "}
                ({products.reduce((sum, p) => sum + (p.workingMonths || 0), 0).toFixed(1)} months)
              </p>
              {products.reduce((sum, p) => sum + (p.workingDays || 0), 0) > yearlyBufferDays && (
                <p className="text-[10px] text-destructive mt-1 font-light">
                  That's more than your yearly capacity — choose wisely
                </p>
              )}
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </MobileOnly>
  );
};

export default Opportunities;
