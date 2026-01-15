import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, RefreshCw, Plus, Trash2, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import MobileOnly from "@/components/MobileOnly";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  
  // Form state
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Analysis state
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RiskAnalysis | null>(null);

  // Get expenses from localStorage for calculations
  const expenses = parseFloat(localStorage.getItem("tc_expenses") || localStorage.getItem("timecost_expenses") || "3000");
  const hourlyLifeCost = expenses / (30 * 24);

  // Check auth and load investments
  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
    const { data, error } = await supabase
      .from("investments")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error loading investments:", error);
      toast({ title: "Error loading investments", variant: "destructive" });
    } else {
      setInvestments(data || []);
      if (data && data.length > 0) {
        fetchPrices(data.map(inv => inv.asset_name));
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
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
      setInvestments(investments.filter(inv => inv.id !== id));
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
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "risk",
          asset: investment.asset_name,
          amount: investment.amount_invested,
          hourlyLifeCost
        }),
      });

      if (!response.ok) throw new Error("Failed to analyze");

      const data = await response.json();
      
      setResult({
        asset: data.asset || investment.asset_name,
        currentValue: investment.amount_invested,
        potentialGain: {
          percentage: data.potentialGainPercent || 10,
          hours: (investment.amount_invested * (data.potentialGainPercent || 10) / 100) / hourlyLifeCost
        },
        potentialLoss: {
          percentage: data.potentialLossPercent || 10,
          hours: (investment.amount_invested * (data.potentialLossPercent || 10) / 100) / hourlyLifeCost
        },
        volatilityLevel: data.volatilityLevel || "medium",
        recommendation: data.recommendation || "Consider your risk tolerance before investing."
      });
    } catch (error) {
      const gainPercent = 15;
      const lossPercent = 20;
      
      setResult({
        asset: investment.asset_name,
        currentValue: investment.amount_invested,
        potentialGain: {
          percentage: gainPercent,
          hours: (investment.amount_invested * gainPercent / 100) / hourlyLifeCost
        },
        potentialLoss: {
          percentage: lossPercent,
          hours: (investment.amount_invested * lossPercent / 100) / hourlyLifeCost
        },
        volatilityLevel: "medium",
        recommendation: "This investment carries moderate risk. Make sure you can afford to lose this time."
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
  const getTotalHoursAtRisk = () => getTotalInvested() * 0.2 / hourlyLifeCost; // Assume 20% risk

  const volatilityColors = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500"
  };

  // If showing analysis result
  if (result && selectedInvestment) {
    return (
      <MobileOnly>
        <div className="min-h-screen bg-background text-foreground pb-28">
          <PageHeader title="Risks" subtitle="See investments in hours at stake" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6"
          >
            <div className="text-center py-4">
              <p className="text-2xl font-bold">{result.asset}</p>
              <p className="text-muted-foreground">${result.currentValue.toLocaleString()} invested</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-500">If +{result.potentialGain.percentage}%</span>
                </div>
                <div className="text-3xl font-black text-green-500">+{result.potentialGain.hours.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground mt-1">hours gained</div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-500">If -{result.potentialLoss.percentage}%</span>
                </div>
                <div className="text-3xl font-black text-red-500">-{result.potentialLoss.hours.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground mt-1">hours lost</div>
              </div>
            </div>

            <div className="mt-6 bg-muted/30 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Volatility Level</span>
                <span className={`font-semibold capitalize ${volatilityColors[result.volatilityLevel]}`}>
                  {result.volatilityLevel}
                </span>
              </div>
            </div>

            <div className="mt-4 bg-foreground text-background rounded-2xl p-5">
              <p className="text-sm font-medium mb-2">AI Recommendation</p>
              <p className="text-sm opacity-80">{result.recommendation}</p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-lg font-medium">
                Are you comfortable trading <span className="text-red-500">{result.potentialLoss.hours.toFixed(0)} hours</span> of your life for a chance to gain <span className="text-green-500">{result.potentialGain.hours.toFixed(0)} hours</span>?
              </p>
            </div>

            <button
              onClick={resetAnalysis}
              className="w-full mt-8 py-4 border border-border rounded-2xl font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Back to portfolio
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
        <PageHeader title="Risks" subtitle="See investments in hours at stake" />

        {/* Not logged in - minimal prompt */}
        {!user && !isLoadingInvestments && (
          <div className="px-6 py-8">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Sign in to track your investments
            </p>
            <button
              onClick={() => window.location.href = "/auth"}
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
            {/* Portfolio Summary */}
            {investments.length > 0 && (
              <div className="px-6 mb-4">
                <div className="bg-foreground text-background rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs opacity-60 font-light">Total Portfolio</p>
                    {isLoadingPrices && <Loader2 className="w-4 h-4 animate-spin opacity-60" />}
                  </div>
                  <p className="text-3xl font-light">${getTotalInvested().toLocaleString()}</p>
                  <p className="text-xs opacity-60 mt-2">
                    ~{getTotalHoursAtRisk().toFixed(0)} hours at risk (20% volatility)
                  </p>
                  <button
                    onClick={() => fetchPrices(investments.map(inv => inv.asset_name))}
                    className="mt-3 text-xs opacity-60 flex items-center gap-1 hover:opacity-100"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh prices
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
                  const dailyHoursChange = (investment.amount_invested * Math.abs(dailyChange) / 100) / hourlyLifeCost;
                  
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
                              <p className={`text-sm font-medium ${dailyChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(2)}%
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {dailyChange >= 0 ? "+" : "-"}{dailyHoursChange.toFixed(1)}h today
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
                          <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                        ) : (
                          "Analyze risk in hours"
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
              </motion.div>
            ) : (
              <div className="px-6 mt-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-4 border border-dashed border-border rounded-2xl font-medium flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  <Plus className="w-5 h-5" />
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
      </div>
    </MobileOnly>
  );
};

export default Risks;
