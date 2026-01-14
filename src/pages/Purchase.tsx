import { useState, useMemo } from "react";
import { Search, TrendingDown, Loader2, Info, ExternalLink, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

interface Alternative {
  title: string;
  price: number;
  hoursCost: number;
  workingDays: number;
  hoursSaved: number;
  daysSaved: number;
  source: string;
  link?: string;
}

interface AnalysisResult {
  productName: string;
  price: number;
  hoursCost: number;
  workingDays: number;
  source?: string;
  link?: string;
  alternatives: Alternative[];
}

const Purchase = () => {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get financial data from Home (localStorage)
  const income = Number(localStorage.getItem("tc_income")) || 0;
  const expenses = Number(localStorage.getItem("tc_expenses")) || 0;
  const netWorth = Number(localStorage.getItem("tc_networth")) || 0;
  
  const freeCash = income - expenses;
  const hasData = income > 0 && expenses > 0;
  const hasNetWorth = netWorth > 0;

  // CORE CALCULATION: Life Buffer
  // Life Buffer = netWorth / expenses = months you can survive without income
  const currentBufferMonths = expenses > 0 ? netWorth / expenses : 0;
  const currentBufferYears = currentBufferMonths / 12;

  // Working hours per month = 22 days * 8 hours = 176 hours
  const WORKING_HOURS_PER_MONTH = 176;
  const WORKING_DAYS_PER_MONTH = 22;

  // $/hour earned toward buffer = monthly surplus / working hours
  const dollarPerHour = freeCash > 0 ? freeCash / WORKING_HOURS_PER_MONTH : 0;

  // Calculate working days to earn back a purchase
  const calculateWorkingDays = (priceValue: number) => {
    if (freeCash <= 0) {
      return expenses > 0 ? (priceValue / expenses) * WORKING_DAYS_PER_MONTH : 0;
    }
    return (priceValue / freeCash) * WORKING_DAYS_PER_MONTH;
  };

  // Calculate buffer impact
  const calculateBufferImpact = (priceValue: number) => {
    const newNetWorth = netWorth - priceValue;
    const newBufferMonths = expenses > 0 ? newNetWorth / expenses : 0;
    const bufferDecrease = currentBufferMonths - newBufferMonths;
    const percentageOfBuffer = netWorth > 0 ? (priceValue / netWorth) * 100 : 0;
    
    return {
      newBufferMonths,
      bufferDecrease,
      percentageOfBuffer
    };
  };

  const analyze = async () => {
    if (!query) return;
    
    setIsAnalyzing(true);
    setError(null);

    // Call SerpAPI to find real prices
    try {
      console.log("Searching for:", query);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          query,
          type: "product"
        }),
      });

      const data = await response.json();
      console.log("Search result:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not find price for this item");
      }
      
      if (!data.price || data.price === 0) {
        throw new Error("No price found - try being more specific (e.g., 'iPhone 16 Pro 256GB')");
      }
      
      // Use scraped price from web
      const productPrice = data.price;
      const days = calculateWorkingDays(productPrice);
      
      const analysisResult: AnalysisResult = {
        productName: data.productName || query,
        price: productPrice,
        hoursCost: days * 8,
        workingDays: days,
        source: data.source,
        link: data.link,
        alternatives: (data.alternatives || []).map((alt: any) => {
          const altDays = calculateWorkingDays(alt.price);
          const savedDays = days - altDays;
          return {
            title: alt.title,
            price: alt.price,
            hoursCost: altDays * 8,
            workingDays: altDays,
            hoursSaved: savedDays * 8,
            daysSaved: savedDays,
            source: alt.source,
            link: alt.link
          };
        })
      };
      
      setResult(analysisResult);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to find price. Try a more specific search.");
    }
    
    setIsAnalyzing(false);
  };

  const reset = () => {
    setQuery("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-light tracking-tight">Purchase</h1>
        <p className="text-muted-foreground text-sm font-light mt-1">See the true cost in hours of life</p>
      </div>

      {/* Warning if no data */}
      {!hasData && (
        <div className="px-6 mb-4">
          <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground font-light">
              Add your income and expenses on the Home page for accurate life-cost calculations.
            </p>
          </div>
        </div>
      )}

      {/* Your rate info */}
      {hasData && !result && (
        <div className="px-6 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your time-cost rate</p>
            <p className="text-lg font-light text-foreground">
              ${dollarPerHour.toFixed(2)}/hour earned
            </p>
            <p className="text-xs text-muted-foreground font-light mt-1">
              Each ${Math.round(freeCash / WORKING_DAYS_PER_MONTH)} spent = 1 working day to earn back
            </p>
            <p className="text-[10px] text-muted-foreground font-light mt-2 opacity-70">
              Based on ${freeCash.toLocaleString()}/mo surplus ÷ {WORKING_DAYS_PER_MONTH} working days
            </p>
          </div>
        </div>
      )}

      {!result ? (
        /* Search Form */
        <div className="px-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">What do you want to buy?</label>
            <div className="relative mt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="iPhone 16 Pro, Tesla Model 3, Bali vacation..."
                className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-light">
              We'll find the real price from the web
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="text-xs text-destructive font-light">{error}</p>
            </div>
          )}

          <button
            onClick={analyze}
            disabled={isAnalyzing || !query}
            className="w-full bg-foreground text-background py-3.5 rounded-xl font-light disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding price...
              </>
            ) : (
              "Calculate Life Cost"
            )}
          </button>

          {/* Quick examples */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Try these</p>
            <div className="flex flex-wrap gap-2">
              {["iPhone 16 Pro", "MacBook Pro M3", "PS5", "AirPods Pro", "Tesla Model 3", "Bali vacation 2 weeks"].map(item => (
                <button
                  key={item}
                  onClick={() => {
                    setQuery(item);
                    setError(null);
                  }}
                  className="px-3 py-1.5 bg-card border border-border rounded-full text-xs font-light hover:bg-muted/50 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results */
        (() => {
          const bufferImpact = calculateBufferImpact(result.price);
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6"
            >
              {/* Main result */}
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm font-light mb-2">
                  {result.productName}
                  {result.source && <span className="opacity-60"> via {result.source}</span>}
                </p>
                <p className="text-lg text-muted-foreground font-light mb-4">
                  ${result.price.toLocaleString()}
                </p>
                <div className="text-6xl font-light tracking-tighter">
                  {result.workingDays.toFixed(1)}
                </div>
                <div className="text-muted-foreground mt-2 font-light">working days to earn back</div>
                <div className="text-xs text-muted-foreground mt-1 font-light">
                  ≈ {result.hoursCost.toFixed(0)} working hours
                </div>
                {result.link && (
                  <a 
                    href={result.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-3 underline"
                  >
                    View product <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Buffer Impact Card */}
              {hasNetWorth && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowDown className="w-4 h-4 text-destructive" />
                    <p className="text-xs font-medium text-destructive uppercase tracking-wider">Buffer Impact</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Current Buffer</p>
                      <p className="text-lg font-light">{currentBufferMonths.toFixed(1)} mo</p>
                      <p className="text-[10px] text-muted-foreground">{currentBufferYears.toFixed(2)} years</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">After Purchase</p>
                      <p className="text-lg font-light text-destructive">{bufferImpact.newBufferMonths.toFixed(1)} mo</p>
                      <p className="text-[10px] text-destructive">−{bufferImpact.bufferDecrease.toFixed(1)} months</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-destructive/20">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">% of your life buffer</p>
                      <p className="text-sm font-medium text-destructive">−{bufferImpact.percentageOfBuffer.toFixed(1)}%</p>
                    </div>
                    {/* Visual bar */}
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-destructive rounded-full transition-all"
                        style={{ width: `${Math.min(bufferImpact.percentageOfBuffer, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-card border border-border rounded-2xl p-4 mb-4">
                <p className="text-xs text-muted-foreground font-light">
                  At your rate of ${dollarPerHour.toFixed(2)}/hour toward your buffer, this purchase requires{" "}
                  <span className="text-foreground font-medium">{result.workingDays.toFixed(1)} working days</span> of earnings to recover.
                </p>
                <p className="text-[10px] text-muted-foreground font-light mt-2 opacity-70">
                  Formula: ${result.price.toLocaleString()} ÷ (${freeCash.toLocaleString()}/mo ÷ {WORKING_DAYS_PER_MONTH} days) = {result.workingDays.toFixed(1)} days
                </p>
              </div>

              {/* Alternatives */}
              {result.alternatives.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <TrendingDown className="w-3 h-3" />
                    Cheaper alternatives found
                  </h3>
                  <div className="space-y-2">
                    {result.alternatives.map((alt, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-sm font-light truncate">{alt.title}</p>
                            <p className="text-xs text-muted-foreground">${alt.price.toLocaleString()} • {alt.source}</p>
                            {alt.link && (
                              <a 
                                href={alt.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-primary mt-1"
                              >
                                View <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-light">{alt.workingDays.toFixed(1)}d</p>
                            <p className="text-xs text-green-500 font-light">
                              Save {alt.daysSaved.toFixed(1)} days
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share card preview */}
              <div className="mt-8 bg-foreground text-background rounded-2xl p-6 text-center">
                <p className="text-xs opacity-60 mb-2 font-light">This {result.productName.split(" ").slice(0, 3).join(" ").toLowerCase()} costs me</p>
                <p className="text-5xl font-light">{result.workingDays.toFixed(1)}</p>
                <p className="text-lg opacity-80 font-light">working days</p>
                <p className="text-xs opacity-60 mt-2 font-light">to earn back</p>
              </div>

              <button
                onClick={reset}
                className="w-full mt-6 py-3.5 border border-border rounded-xl font-light"
              >
                Analyze another purchase
              </button>
            </motion.div>
          );
        })()
      )}

      <BottomNav />
    </div>
  );
};

export default Purchase;