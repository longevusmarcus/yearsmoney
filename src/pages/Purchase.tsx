import { useState } from "react";
import { Search, Clock, TrendingDown, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

interface Alternative {
  title: string;
  price: number;
  hoursCost: number;
  hoursSaved: number;
  source: string;
}

interface AnalysisResult {
  productName: string;
  price: number;
  hoursCost: number;
  workingDays: number;
  waitSuggestion?: string;
  hoursSavedWaiting?: number;
  alternatives: Alternative[];
}

const Purchase = () => {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Get financial data from Home (localStorage)
  const income = Number(localStorage.getItem("tc_income")) || 0;
  const expenses = Number(localStorage.getItem("tc_expenses")) || 0;
  const netWorth = Number(localStorage.getItem("tc_networth")) || 0;
  
  const freeCash = income - expenses;
  const hasData = income > 0 && expenses > 0;

  // Life cost calculation: based on rate at which optional life advances
  // Hours cost = (price / freeCash) * hours in a month
  // This represents how many hours of "optional life advancement" this purchase costs
  const calculateHours = (priceValue: number) => {
    if (freeCash <= 0) {
      // If no free cash, base it on how many months of runway it takes
      return expenses > 0 ? (priceValue / expenses) * 30 * 24 : 0;
    }
    // Hours = (price / monthly_savings) * hours_per_month
    // This shows how many hours of life-advancement this purchase delays
    return (priceValue / freeCash) * 30 * 24;
  };

  const analyze = async () => {
    if (!query && !price) return;
    
    setIsAnalyzing(true);
    
    // If just a price, do simple calculation
    if (price && !query) {
      const priceNum = parseFloat(price);
      const hours = calculateHours(priceNum);
      setResult({
        productName: "Your purchase",
        price: priceNum,
        hoursCost: hours,
        workingDays: hours / 8,
        alternatives: []
      });
      setIsAnalyzing(false);
      return;
    }

    // Call AI for product analysis
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "purchase",
          query,
          price: price ? parseFloat(price) : null,
          freeCash,
          expenses
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze");

      const data = await response.json();
      
      // Calculate hours for each result
      const productPrice = data.price || parseFloat(price) || 0;
      const analysisResult: AnalysisResult = {
        productName: data.productName || query,
        price: productPrice,
        hoursCost: calculateHours(productPrice),
        workingDays: calculateHours(productPrice) / 8,
        waitSuggestion: data.waitSuggestion,
        hoursSavedWaiting: data.hoursSavedWaiting ? calculateHours(data.hoursSavedWaiting) : undefined,
        alternatives: (data.alternatives || []).map((alt: any) => ({
          ...alt,
          hoursCost: calculateHours(alt.price),
          hoursSaved: calculateHours(productPrice - alt.price)
        }))
      };
      
      setResult(analysisResult);
    } catch (error) {
      // Fallback to simple calculation
      const priceNum = parseFloat(price) || 500;
      setResult({
        productName: query || "Product",
        price: priceNum,
        hoursCost: calculateHours(priceNum),
        workingDays: calculateHours(priceNum) / 8,
        alternatives: []
      });
    }
    
    setIsAnalyzing(false);
  };

  const reset = () => {
    setQuery("");
    setPrice("");
    setResult(null);
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
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your life-time rate</p>
            <p className="text-lg font-light text-foreground">
              ${freeCash.toLocaleString()}/month savings
            </p>
            <p className="text-xs text-muted-foreground font-light mt-1">
              Each ${freeCash > 0 ? Math.round(freeCash / 720) : '—'} spent = 1 hour of life delayed
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="MacBook Pro, vacation to Japan..."
                className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Price (optional)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2499"
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 mt-2 text-sm font-light focus:outline-none focus:ring-1 focus:ring-foreground/20"
            />
          </div>

          <button
            onClick={analyze}
            disabled={isAnalyzing || (!query && !price)}
            className="w-full bg-foreground text-background py-3.5 rounded-xl font-light disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Calculate Life Cost"
            )}
          </button>

          {/* Quick examples */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Popular</p>
            <div className="flex flex-wrap gap-2">
              {["iPhone 16 Pro", "Tesla Model 3", "Bali vacation", "PS5"].map(item => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="px-3 py-1.5 bg-card border border-border rounded-full text-xs font-light"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6"
        >
          {/* Main result */}
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm font-light mb-2">{result.productName}</p>
            <div className="text-6xl font-light tracking-tighter">
              {result.hoursCost.toFixed(0)}
            </div>
            <div className="text-muted-foreground mt-2 font-light">hours of life</div>
            <div className="text-xs text-muted-foreground mt-1 font-light">
              ≈ {result.workingDays.toFixed(0)} working days
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <p className="text-xs text-muted-foreground font-light">
              Based on your savings rate of ${freeCash.toLocaleString()}/mo, this purchase delays your optional life by {result.hoursCost.toFixed(0)} hours.
            </p>
          </div>

          {/* Wait suggestion */}
          {result.waitSuggestion && (
            <div className="bg-card border border-border rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-light">{result.waitSuggestion}</p>
                  {result.hoursSavedWaiting && (
                    <p className="text-xs text-muted-foreground mt-1 font-light">
                      Save {result.hoursSavedWaiting.toFixed(0)} hours of life
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Alternatives */}
          {result.alternatives.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs text-muted-foreground mb-3 flex items-center gap-2 uppercase tracking-wider">
                <TrendingDown className="w-3 h-3" />
                Cheaper alternatives
              </h3>
              <div className="space-y-2">
                {result.alternatives.map((alt, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-light">{alt.title}</p>
                        <p className="text-xs text-muted-foreground">{alt.source}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-light">{alt.hoursCost.toFixed(0)}h</p>
                        <p className="text-xs text-green-500 font-light">
                          Save {alt.hoursSaved.toFixed(0)}h
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
            <p className="text-xs opacity-60 mb-2 font-light">This {result.productName.toLowerCase()} costs me</p>
            <p className="text-5xl font-light">{result.hoursCost.toFixed(0)} hours</p>
            <p className="text-xs opacity-60 mt-2 font-light">of my life</p>
          </div>

          <button
            onClick={reset}
            className="w-full mt-6 py-3.5 border border-border rounded-xl font-light"
          >
            Analyze another purchase
          </button>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
};

export default Purchase;