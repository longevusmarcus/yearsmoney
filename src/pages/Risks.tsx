import { useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

interface RiskAnalysis {
  asset: string;
  currentValue: number;
  potentialGain: { percentage: number; hours: number };
  potentialLoss: { percentage: number; hours: number };
  volatilityLevel: "low" | "medium" | "high";
  recommendation: string;
}

const Risks = () => {
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RiskAnalysis | null>(null);

  // Get expenses from localStorage for calculations
  const expenses = parseFloat(localStorage.getItem("timecost_expenses") || "3000");
  const hourlyLifeCost = expenses / (30 * 24);

  const analyze = async () => {
    if (!asset || !amount) return;
    
    setIsAnalyzing(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "risk",
          asset,
          amount: parseFloat(amount),
          hourlyLifeCost
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze");

      const data = await response.json();
      
      const amountNum = parseFloat(amount);
      setResult({
        asset: data.asset || asset,
        currentValue: amountNum,
        potentialGain: {
          percentage: data.potentialGainPercent || 10,
          hours: (amountNum * (data.potentialGainPercent || 10) / 100) / hourlyLifeCost
        },
        potentialLoss: {
          percentage: data.potentialLossPercent || 10,
          hours: (amountNum * (data.potentialLossPercent || 10) / 100) / hourlyLifeCost
        },
        volatilityLevel: data.volatilityLevel || "medium",
        recommendation: data.recommendation || "Consider your risk tolerance before investing."
      });
    } catch (error) {
      // Fallback with reasonable defaults
      const amountNum = parseFloat(amount);
      const gainPercent = 15;
      const lossPercent = 20;
      
      setResult({
        asset: asset,
        currentValue: amountNum,
        potentialGain: {
          percentage: gainPercent,
          hours: (amountNum * gainPercent / 100) / hourlyLifeCost
        },
        potentialLoss: {
          percentage: lossPercent,
          hours: (amountNum * lossPercent / 100) / hourlyLifeCost
        },
        volatilityLevel: "medium",
        recommendation: "This investment carries moderate risk. Make sure you can afford to lose this time."
      });
    }
    
    setIsAnalyzing(false);
  };

  const reset = () => {
    setAsset("");
    setAmount("");
    setResult(null);
  };

  const volatilityColors = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500"
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-light tracking-tight">Risks</h1>
        <p className="text-muted-foreground text-sm font-light mt-1">See investments in hours at stake</p>
      </div>

      {!result ? (
        /* Input Form */
        <div className="px-6 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">What are you investing in?</label>
            <input
              type="text"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              placeholder="Bitcoin, Tesla stock, S&P 500..."
              className="w-full bg-muted/30 rounded-xl px-4 py-4 mt-2 text-lg"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">How much are you investing?</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$5,000"
              className="w-full bg-muted/30 rounded-xl px-4 py-4 mt-2 text-lg font-medium"
            />
          </div>

          <button
            onClick={analyze}
            disabled={isAnalyzing || !asset || !amount}
            className="w-full bg-foreground text-background py-4 rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing risk...
              </>
            ) : (
              "Calculate Risk in Hours"
            )}
          </button>

          {/* Popular assets */}
          <div className="pt-6">
            <p className="text-sm text-muted-foreground mb-3">Popular assets</p>
            <div className="flex flex-wrap gap-2">
              {["Bitcoin", "Ethereum", "S&P 500", "Tesla", "Apple"].map(item => (
                <button
                  key={item}
                  onClick={() => setAsset(item)}
                  className="px-3 py-2 bg-muted/30 rounded-full text-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="mt-6 bg-muted/30 rounded-2xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                We translate financial volatility into hours of life at risk, making abstract percentages feel real.
              </p>
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
          {/* Asset header */}
          <div className="text-center py-4">
            <p className="text-2xl font-bold">{result.asset}</p>
            <p className="text-muted-foreground">${result.currentValue.toLocaleString()} invested</p>
          </div>

          {/* Risk cards */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Potential gain */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500">If +{result.potentialGain.percentage}%</span>
              </div>
              <div className="text-3xl font-black text-green-500">
                +{result.potentialGain.hours.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">hours gained</div>
            </div>

            {/* Potential loss */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-500">If -{result.potentialLoss.percentage}%</span>
              </div>
              <div className="text-3xl font-black text-red-500">
                -{result.potentialLoss.hours.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">hours lost</div>
            </div>
          </div>

          {/* Volatility indicator */}
          <div className="mt-6 bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volatility Level</span>
              <span className={`font-semibold capitalize ${volatilityColors[result.volatilityLevel]}`}>
                {result.volatilityLevel}
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-4 bg-foreground text-background rounded-2xl p-5">
            <p className="text-sm font-medium mb-2">AI Recommendation</p>
            <p className="text-sm opacity-80">{result.recommendation}</p>
          </div>

          {/* The question */}
          <div className="mt-6 text-center">
            <p className="text-lg font-medium">
              Are you comfortable trading <span className="text-red-500">{result.potentialLoss.hours.toFixed(0)} hours</span> of your life for a chance to gain <span className="text-green-500">{result.potentialGain.hours.toFixed(0)} hours</span>?
            </p>
          </div>

          <button
            onClick={reset}
            className="w-full mt-8 py-4 border border-border rounded-2xl font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Analyze another investment
          </button>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
};

export default Risks;
