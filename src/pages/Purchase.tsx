import { useState } from "react";
import { Search, Clock, TrendingDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Get expenses from localStorage for calculations
  const expenses = parseFloat(localStorage.getItem("timecost_expenses") || "3000");
  const hourlyLifeCost = expenses / (30 * 24); // cost per hour of life

  const calculateHours = (priceValue: number) => {
    return priceValue / hourlyLifeCost;
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
          hourlyLifeCost
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze");

      const data = await response.json();
      
      // Calculate hours for each result
      const analysisResult: AnalysisResult = {
        productName: data.productName || query,
        price: data.price || parseFloat(price) || 0,
        hoursCost: calculateHours(data.price || parseFloat(price) || 0),
        workingDays: calculateHours(data.price || parseFloat(price) || 0) / 8,
        waitSuggestion: data.waitSuggestion,
        hoursSavedWaiting: data.hoursSavedWaiting,
        alternatives: (data.alternatives || []).map((alt: any) => ({
          ...alt,
          hoursCost: calculateHours(alt.price),
          hoursSaved: calculateHours((data.price || parseFloat(price) || 0) - alt.price)
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
        <h1 className="text-2xl font-bold tracking-tight">Purchase Optimizer</h1>
        <p className="text-muted-foreground text-sm mt-1">See the true cost in hours of life</p>
      </div>

      {!result ? (
        /* Search Form */
        <div className="px-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">What do you want to buy?</label>
            <div className="relative mt-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="MacBook Pro, vacation to Japan..."
                className="w-full bg-muted/30 rounded-xl pl-12 pr-4 py-4 text-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Price (optional)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="$2,499"
              className="w-full bg-muted/30 rounded-xl px-4 py-4 mt-2 text-lg font-medium"
            />
          </div>

          <button
            onClick={analyze}
            disabled={isAnalyzing || (!query && !price)}
            className="w-full bg-foreground text-background py-4 rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Calculate Life Cost"
            )}
          </button>

          {/* Quick examples */}
          <div className="pt-6">
            <p className="text-sm text-muted-foreground mb-3">Popular searches</p>
            <div className="flex flex-wrap gap-2">
              {["iPhone 16 Pro", "Tesla Model 3", "Bali vacation", "PS5"].map(item => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="px-3 py-2 bg-muted/30 rounded-full text-sm"
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
            <p className="text-muted-foreground text-sm mb-2">{result.productName}</p>
            <div className="text-7xl font-black tracking-tighter">
              {result.hoursCost.toFixed(0)}
            </div>
            <div className="text-muted-foreground mt-2">hours of your life</div>
            <div className="text-sm text-muted-foreground mt-1">
              ≈ {result.workingDays.toFixed(0)} working days
            </div>
          </div>

          {/* Wait suggestion */}
          {result.waitSuggestion && (
            <div className="bg-muted/30 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">{result.waitSuggestion}</p>
                  {result.hoursSavedWaiting && (
                    <p className="text-sm text-muted-foreground mt-1">
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
              <h3 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Cheaper alternatives
              </h3>
              <div className="space-y-3">
                {result.alternatives.map((alt, i) => (
                  <div key={i} className="bg-muted/30 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alt.title}</p>
                        <p className="text-sm text-muted-foreground">{alt.source}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{alt.hoursCost.toFixed(0)}h</p>
                        <p className="text-xs text-green-500">
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
            <p className="text-sm opacity-60 mb-2">This {result.productName.toLowerCase()} costs me</p>
            <p className="text-5xl font-black">{result.hoursCost.toFixed(0)} hours</p>
            <p className="text-sm opacity-60 mt-2">of my life</p>
          </div>

          <button
            onClick={reset}
            className="w-full mt-6 py-4 border border-border rounded-2xl font-medium"
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
