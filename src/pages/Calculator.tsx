import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Clock, Hourglass, DollarSign, TrendingDown, Share2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

type Screen = "input" | "buffer" | "purchase" | "share";

interface FinancialData {
  income: number;
  expenses: number;
  netWorth: number;
}

interface PurchaseData {
  price: number;
  name: string;
}

const Calculator = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("input");
  const [financialData, setFinancialData] = useState<FinancialData>({
    income: 0,
    expenses: 0,
    netWorth: 0,
  });
  const [purchaseData, setPurchaseData] = useState<PurchaseData>({
    price: 0,
    name: "",
  });

  // Calculations
  const freeCash = financialData.income - financialData.expenses;
  const isNegativeCash = freeCash < 0;
  
  const lifeMonths = financialData.expenses > 0 
    ? financialData.netWorth / financialData.expenses 
    : 0;
  const lifeYears = lifeMonths / 12;
  
  const purchaseLifeMonths = financialData.expenses > 0 
    ? purchaseData.price / financialData.expenses 
    : 0;
  const purchaseLifeDays = purchaseLifeMonths * 30;
  const purchaseLifeHours = purchaseLifeDays * 24;
  const purchaseWorkingDays = purchaseLifeHours / 8;

  const formatNumber = (num: number, decimals: number = 1) => {
    if (num >= 1000) return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return num.toFixed(decimals);
  };

  const handleInputChange = (field: keyof FinancialData, value: string) => {
    const numValue = parseFloat(value.replace(/,/g, '')) || 0;
    setFinancialData(prev => ({ ...prev, [field]: numValue }));
  };

  const renderInputScreen = () => (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">
          Your numbers
        </h1>
        <p className="text-muted-foreground">
          No data is stored. Everything stays on your device.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Monthly Income (net)
          </label>
          <Input
            type="text"
            placeholder="5,000"
            className="bg-card border-border text-foreground text-lg py-6"
            onChange={(e) => handleInputChange("income", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Monthly Expenses
          </label>
          <Input
            type="text"
            placeholder="3,500"
            className="bg-card border-border text-foreground text-lg py-6"
            onChange={(e) => handleInputChange("expenses", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            <Hourglass className="h-4 w-4" />
            Net Worth (liquid + semi-liquid)
          </label>
          <Input
            type="text"
            placeholder="50,000"
            className="bg-card border-border text-foreground text-lg py-6"
            onChange={(e) => handleInputChange("netWorth", e.target.value)}
          />
        </div>

        <Button
          onClick={() => setCurrentScreen("buffer")}
          disabled={financialData.expenses === 0}
          className="w-full rounded-full py-6 text-base bg-primary hover:bg-primary/90 mt-8"
        >
          Calculate Your Life Buffer <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );

  const renderBufferScreen = () => (
    <motion.div
      key="buffer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto text-center"
    >
      {isNegativeCash && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-8 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-left text-destructive">
            You're spending ${Math.abs(freeCash).toLocaleString()} more than you earn each month. 
            You're trading future life.
          </p>
        </motion.div>
      )}

      <div className="mb-4">
        <span className="text-muted-foreground text-lg">You have</span>
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <h1 className="text-7xl md:text-9xl font-light text-foreground mb-2">
          {formatNumber(lifeYears)}
        </h1>
        <p className="text-2xl md:text-3xl text-muted-foreground font-light">
          years of optional life
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-6 bg-card/60 border border-border/50 rounded-2xl"
      >
        <p className="text-muted-foreground">
          That's <span className="text-foreground font-medium">{formatNumber(lifeMonths)} months</span> you 
          could live without earning, based on your current net worth and expenses.
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 mt-12">
        <Button
          onClick={() => setCurrentScreen("purchase")}
          className="w-full rounded-full py-6 text-base bg-primary hover:bg-primary/90"
        >
          Analyze a Purchase <Clock className="ml-2 h-5 w-5" />
        </Button>
        <Button
          onClick={() => setCurrentScreen("input")}
          variant="ghost"
          className="w-full rounded-full py-6 text-base"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Edit Numbers
        </Button>
      </div>
    </motion.div>
  );

  const renderPurchaseScreen = () => (
    <motion.div
      key="purchase"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">
          What are you considering?
        </h1>
        <p className="text-muted-foreground">
          Enter a product name and price to see the true cost.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">What is it?</label>
          <Input
            type="text"
            placeholder="MacBook Pro"
            className="bg-card border-border text-foreground text-lg py-6"
            value={purchaseData.name}
            onChange={(e) => setPurchaseData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Price ($)</label>
          <Input
            type="text"
            placeholder="2,499"
            className="bg-card border-border text-foreground text-lg py-6"
            onChange={(e) => {
              const numValue = parseFloat(e.target.value.replace(/,/g, '')) || 0;
              setPurchaseData(prev => ({ ...prev, price: numValue }));
            }}
          />
        </div>
      </div>

      {purchaseData.price > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-muted-foreground mb-4">
            {purchaseData.name || "This"} costs you
          </p>
          <h2 className="text-6xl md:text-8xl font-light text-foreground mb-2">
            {formatNumber(purchaseLifeHours, 0)}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            hours of life
          </p>
          <p className="text-muted-foreground mt-4">
            That's <span className="text-foreground">{formatNumber(purchaseWorkingDays, 0)} working days</span> or{" "}
            <span className="text-foreground">{formatNumber(purchaseLifeMonths)} months</span> of your expenses.
          </p>
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
        {purchaseData.price > 0 && (
          <Button
            onClick={() => setCurrentScreen("share")}
            className="w-full rounded-full py-6 text-base bg-primary hover:bg-primary/90"
          >
            Create Share Card <Share2 className="ml-2 h-5 w-5" />
          </Button>
        )}
        <Button
          onClick={() => setCurrentScreen("buffer")}
          variant="ghost"
          className="w-full rounded-full py-6 text-base"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Buffer
        </Button>
      </div>
    </motion.div>
  );

  const renderShareScreen = () => (
    <motion.div
      key="share"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-foreground mb-4">
          Share your truth
        </h1>
        <p className="text-muted-foreground">
          Screenshot this card and share it.
        </p>
      </div>

      {/* Share Card - Dark, minimal, viral-ready */}
      <div className="bg-[#0a0a0a] rounded-3xl p-8 md:p-12 text-center border border-white/10">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-6">
          {purchaseData.name || "This purchase"}
        </p>
        <h2 className="text-6xl md:text-8xl font-extralight text-white mb-4">
          {formatNumber(purchaseLifeHours, 0)}
        </h2>
        <p className="text-white/80 text-xl md:text-2xl font-light mb-8">
          hours of my life
        </p>
        <div className="border-t border-white/10 pt-6">
          <p className="text-white/40 text-sm">
            timecost.app
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <Button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${purchaseData.name} costs ${formatNumber(purchaseLifeHours, 0)} hours of my life`,
                text: `This ${purchaseData.name} would cost me ${formatNumber(purchaseLifeHours, 0)} hours of my life. That's ${formatNumber(purchaseWorkingDays, 0)} working days.`,
                url: window.location.origin,
              });
            }
          }}
          className="w-full rounded-full py-6 text-base bg-primary hover:bg-primary/90"
        >
          Share <Share2 className="ml-2 h-5 w-5" />
        </Button>
        <Button
          onClick={() => setCurrentScreen("purchase")}
          variant="ghost"
          className="w-full rounded-full py-6 text-base"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Try Another Purchase
        </Button>
        <Button
          onClick={() => setCurrentScreen("input")}
          variant="ghost"
          className="w-full rounded-full py-6 text-base text-muted-foreground"
        >
          Start Over
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-background/20">
          <Link
            to="/about"
            className="text-xl font-light tracking-wide bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            TimeCost
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Calculator</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
        <AnimatePresence mode="wait">
          {currentScreen === "input" && renderInputScreen()}
          {currentScreen === "buffer" && renderBufferScreen()}
          {currentScreen === "purchase" && renderPurchaseScreen()}
          {currentScreen === "share" && renderShareScreen()}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Calculator;
