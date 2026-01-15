import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, RefreshCw, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import MobileOnly from "@/components/MobileOnly";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";

interface Investment {
  id: string;
  asset_name: string;
  asset_symbol?: string;
  amount_invested: number;
  quantity?: number;
  purchase_price?: number;
}

interface PriceData {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
}

interface RiskAnalysis {
  asset: string;
  currentValue: number;
  potentialGain: { percentage: number; hours: number };
  potentialLoss: { percentage: number; hours: number };
  volatilityLevel: "low" | "medium" | "high";
  recommendation: string;
}

const Risks = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form state
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Analysis state
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RiskAnalysis | null>(null);

  // Get financial data from Home page
  const income = parseFloat(localStorage.getItem("tc_income") || "0");
  const expenses = parseFloat(localStorage.getItem("tc_expenses") || "3000");
  const netWorth = parseFloat(localStorage.getItem("tc_networth") || "0");
  const freeCash = income - expenses;

  // Hours calculation based on expenses (what 1 hour of life costs)
  const hourlyLifeCost = expenses / (30 * 24); // Monthly expenses / hours in month
  const hasFinancialData = income > 0 && expenses > 0;

  // Life buffer in months
  const lifeBufferMonths = expenses > 0 ? netWorth / expenses : 0;

  // Check auth and load investments
  useEffect(() => {
    // Set up auth listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setTimeout(() => loadInvestments(), 0);
      } else {
        setInvestments([]);
        setIsLoadingInvestments(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadInvestments();
      } else {
        setIsLoadingInvestments(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadInvestments = async () => {
    setIsLoadingInvestments(true);
    const { data, error } = await supabase.from("investments").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading investments:", error);
      toast({ title: "Error loading investments", variant: "destructive" });
    } else {
      setInvestments(data || []);
      if (data && data.length > 0) {
        fetchPrices(data.map((inv) => inv.asset_name));
      }
    }
    setIsLoadingInvestments(false);
  };

  const fetchPrices = async (assetNames: string[]) => {
    if (assetNames.length === 0) return;

    setIsLoadingPrices(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investment-prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ assets: assetNames }),
      });

      if (response.ok) {
        const data = await response.json();
        const priceMap: Record<string, PriceData> = {};
        data.prices?.forEach((p: PriceData) => {
          priceMap[p.symbol.toLowerCase()] = p;
          priceMap[p.name.toLowerCase()] = p;
        });
        setPrices(priceMap);
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
    setIsLoadingPrices(false);
  };

  const addInvestment = async () => {
    if (!asset || !amount || !user) return;

    setIsAdding(true);
    const { error } = await supabase.from("investments").insert({
      user_id: user.id,
      asset_name: asset,
      amount_invested: parseFloat(amount),
    });

    if (error) {
      toast({ title: "Error adding investment", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Investment added" });
      setAsset("");
      setAmount("");
      setShowAddForm(false);
      loadInvestments();
    }
    setIsAdding(false);
  };

  const deleteInvestment = async (id: string) => {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting investment", variant: "destructive" });
    } else {
      setInvestments(investments.filter((inv) => inv.id !== id));
    }
  };

  const analyzeInvestment = async (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsAnalyzing(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "risk",
          asset: investment.asset_name,
          amount: investment.amount_invested,
          hourlyLifeCost,
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze");

      const data = await response.json();

      setResult({
        asset: data.asset || investment.asset_name,
        currentValue: investment.amount_invested,
        potentialGain: {
          percentage: data.potentialGainPercent || 10,
          hours: (investment.amount_invested * (data.potentialGainPercent || 10)) / 100 / hourlyLifeCost,
        },
        potentialLoss: {
          percentage: data.potentialLossPercent || 10,
          hours: (investment.amount_invested * (data.potentialLossPercent || 10)) / 100 / hourlyLifeCost,
        },
        volatilityLevel: data.volatilityLevel || "medium",
        recommendation: data.recommendation || "Consider your risk tolerance before investing.",
      });
    } catch (error) {
      const gainPercent = 15;
      const lossPercent = 20;

      setResult({
        asset: investment.asset_name,
        currentValue: investment.amount_invested,
        potentialGain: {
          percentage: gainPercent,
          hours: (investment.amount_invested * gainPercent) / 100 / hourlyLifeCost,
        },
        potentialLoss: {
          percentage: lossPercent,
          hours: (investment.amount_invested * lossPercent) / 100 / hourlyLifeCost,
        },
        volatilityLevel: "medium",
        recommendation: "This investment carries moderate risk. Make sure you can afford to lose this time.",
      });
    }

    setIsAnalyzing(false);
  };

  const resetAnalysis = () => {
    setSelectedInvestment(null);
    setResult(null);
  };

  const getPriceForAsset = (assetName: string) => {
    return prices[assetName.toLowerCase()];
  };

  const getTotalInvested = () => investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
  const getTotalHoursAtRisk = () => (getTotalInvested() * 0.2) / hourlyLifeCost; // Assume 20% risk

  const volatilityColors = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500",
  };

  // Calculate life scenarios based on hours lost
  const getLifeScenarios = (hoursLost: number) => {
    const daysLost = hoursLost / 24;
    const weeksLost = daysLost / 7;
    const monthsLost = daysLost / 30;
    const yearsLost = monthsLost / 12;

    const scenarios = [];

    if (yearsLost >= 1) {
      scenarios.push({ label: "Years of freedom", value: yearsLost.toFixed(1), unit: "years" });
    }
    if (monthsLost >= 1) {
      scenarios.push({ label: "Months to help parents", value: monthsLost.toFixed(1), unit: "months" });
    }
    if (weeksLost >= 2) {
      scenarios.push({ label: "Weeks to build something", value: weeksLost.toFixed(0), unit: "weeks" });
    }
    if (daysLost >= 30) {
      scenarios.push({ label: "Family vacation days", value: Math.floor(daysLost / 7), unit: "trips" });
    }

    return scenarios.slice(0, 3);
  };

  // If showing analysis result
  if (result && selectedInvestment) {
    const hoursLost = result.potentialLoss.hours;
    const hoursGained = result.potentialGain.hours;
    const yearsLost = hoursLost / (24 * 365);
    const scenarios = getLifeScenarios(hoursLost);

    return (
      <MobileOnly>
        <div className="min-h-screen bg-background text-foreground pb-28">
          <PageHeader title="Risks" subtitle="See investments in years at stake" />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6">
            {/* Asset header - minimal */}
            <div className="py-6">
              <p className="text-xl font-light">{result.asset}</p>
              <p className="text-sm text-muted-foreground font-light">
                ${result.currentValue.toLocaleString()} invested
              </p>
            </div>

            {/* Gain/Loss cards - refined */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-green-500/20 rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground mb-1">If +{result.potentialGain.percentage}%</p>
                <p className="text-2xl font-light text-green-500">+{hoursGained.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">hours gained</p>
              </div>

              <div className="border border-red-500/20 rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground mb-1">If -{result.potentialLoss.percentage}%</p>
                <p className="text-2xl font-light text-red-500">-{hoursLost.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">hours lost</p>
              </div>
            </div>

            {/* Life scenarios - what you could lose */}
            {scenarios.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-3">If this investment fails, you lose:</p>
                <div className="space-y-2">
                  {scenarios.map((scenario, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/30">
                      <span className="text-sm font-light text-muted-foreground">{scenario.label}</span>
                      <span className="text-sm font-light">
                        {scenario.value} <span className="text-muted-foreground">{scenario.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Years of life at risk - prominent */}
            {yearsLost >= 0.1 && (
              <div className="mt-6 py-4 text-center">
                <p className="text-4xl font-light text-red-500">{yearsLost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">years of life at risk</p>
              </div>
            )}

            {/* Volatility */}
            <div className="mt-4 flex items-center justify-between py-3 border-b border-border/30">
              <span className="text-sm text-muted-foreground font-light">Volatility</span>
              <span className={`text-sm font-light capitalize ${volatilityColors[result.volatilityLevel]}`}>
                {result.volatilityLevel}
              </span>
            </div>

            {/* AI Recommendation - minimal */}
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2">AI insight</p>
              <p className="text-sm font-light leading-relaxed">{result.recommendation}</p>
            </div>

            {/* Question - refined */}
            <div className="mt-8 py-4 border-t border-border/30">
              <p className="text-sm font-light text-center leading-relaxed">
                Trading <span className="text-red-500">{hoursLost.toFixed(0)}h</span> of life for a chance at{" "}
                <span className="text-green-500">+{hoursGained.toFixed(0)}h</span>
              </p>
            </div>

            <button
              onClick={resetAnalysis}
              className="w-full mt-4 py-3 border border-border rounded-xl text-sm font-light"
            >
              Back
            </button>
          </motion.div>

          <BottomNav />
        </div>
      </MobileOnly>
    );
  }

  return (
    <MobileOnly>
      <div className="min-h-screen bg-background text-foreground pb-28">
        <PageHeader title="Risks" subtitle="See investments in years at stake" />

        {/* Not logged in - minimal prompt */}
        {!user && !isLoadingInvestments && (
          <div className="px-6 py-8">
            <p className="text-sm text-muted-foreground text-center mb-4">Sign in to track your investments</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 border border-border rounded-xl text-sm font-light hover:bg-muted/20 transition-colors"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoadingInvestments && (
          <div className="px-6 py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}

        {/* Logged in - Portfolio */}
        {user && !isLoadingInvestments && (
          <>
            {/* No financial data warning */}
            {!hasFinancialData && (
              <div className="px-6 mb-4">
                <p className="text-xs text-muted-foreground text-center py-3">
                  Add income & expenses on Home for personalized time calculations
                </p>
              </div>
            )}

            {/* Portfolio Summary */}
            {investments.length > 0 && (
              <div className="px-6 mb-4">
                <div className="py-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Portfolio</p>
                  <p className="text-3xl font-light">${getTotalInvested().toLocaleString()}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs text-muted-foreground">~{getTotalHoursAtRisk().toFixed(0)}h at risk</p>
                    <p className="text-xs text-muted-foreground">
                      {(getTotalHoursAtRisk() / (24 * 365)).toFixed(2)} years
                    </p>
                  </div>
                  <button
                    onClick={() => fetchPrices(investments.map((inv) => inv.asset_name))}
                    className="mt-3 text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> {isLoadingPrices ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>
            )}

            {/* Investment List */}
            <div className="px-6 space-y-3">
              <AnimatePresence>
                {investments.map((investment) => {
                  const priceData = getPriceForAsset(investment.asset_name);
                  const dailyChange = priceData?.changePercent24h || 0;
                  const dailyHoursChange = (investment.amount_invested * Math.abs(dailyChange)) / 100 / hourlyLifeCost;

                  return (
                    <motion.div
                      key={investment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-card border border-border rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1" onClick={() => analyzeInvestment(investment)}>
                          <p className="font-medium">{investment.asset_name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${investment.amount_invested.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {priceData && (
                            <div className="text-right">
                              <p
                                className={`text-sm font-medium ${dailyChange >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                {dailyChange >= 0 ? "+" : ""}
                                {dailyChange.toFixed(2)}%
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {dailyChange >= 0 ? "+" : "-"}
                                {dailyHoursChange.toFixed(1)}h today
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() => deleteInvestment(investment.id)}
                            className="p-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => analyzeInvestment(investment)}
                        disabled={isAnalyzing}
                        className="w-full mt-3 py-2 bg-muted/30 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                      >
                        {isAnalyzing && selectedInvestment?.id === investment.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                          </>
                        ) : (
                          "Analyze risk in hours & years"
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Add Investment Form */}
            {showAddForm ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 mt-4 space-y-4"
              >
                <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Asset name</label>
                    <input
                      type="text"
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      placeholder="Bitcoin, Tesla, S&P 500..."
                      className="w-full bg-muted/30 rounded-xl px-4 py-3 mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Amount invested ($)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-muted/30 rounded-xl px-4 py-3 mt-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-3 border border-border rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addInvestment}
                      disabled={isAdding || !asset || !amount}
                      className="flex-1 py-3 bg-foreground text-background rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add
                    </button>
                  </div>
                </div>

                {/* Quick select */}
                <div className="flex flex-wrap gap-2">
                  {["Bitcoin", "Ethereum", "S&P 500", "Tesla", "Apple"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setAsset(item)}
                      className="px-3 py-2 bg-muted/30 rounded-full text-sm"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="px-6 mt-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-4 bg-foreground text-background rounded-2xl font-light flex items-center justify-center gap-2"
                >
                  Add investment
                </button>
              </div>
            )}

            {/* Info box */}
            <div className="px-6 mt-6">
              <div className="bg-muted/30 rounded-2xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Your investments are saved and we fetch live prices to show daily changes in hours of life.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <BottomNav />

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </div>
    </MobileOnly>
  );
};

export default Risks;
