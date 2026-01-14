import { useState, useEffect } from "react";
import { Sparkles, Plane, Laptop, BookOpen, Dumbbell, Coffee, Loader2, Info, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

interface Opportunity {
  id: string;
  category: string;
  title: string;
  price: number;
  workingDays: number;
  description: string;
  icon: string;
  roi?: string;
}

const iconMap: Record<string, any> = {
  travel: Plane,
  tech: Laptop,
  learning: BookOpen,
  fitness: Dumbbell,
  experience: Coffee,
  default: Sparkles
};

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get user's financial data from Home (localStorage with tc_ prefix)
  const income = Number(localStorage.getItem("tc_income")) || 0;
  const expenses = Number(localStorage.getItem("tc_expenses")) || 0;
  const netWorth = Number(localStorage.getItem("tc_networth")) || 0;
  
  const freeCash = income - expenses;
  const hasData = income > 0 && expenses > 0;

  // CORE CALCULATION: Working days to earn back a purchase
  const WORKING_DAYS_PER_MONTH = 22;
  const dailyEarnings = freeCash > 0 ? freeCash / WORKING_DAYS_PER_MONTH : 0;

  const calculateWorkingDays = (priceValue: number) => {
    if (freeCash <= 0) {
      return expenses > 0 ? (priceValue / expenses) * WORKING_DAYS_PER_MONTH : 0;
    }
    return priceValue / dailyEarnings;
  };

  // Yearly working days of buffer = working days in a year = ~260
  const WORKING_DAYS_PER_YEAR = 260;
  // How many "days of buffer" can you accumulate per year
  const yearlyBufferDays = freeCash > 0 ? (freeCash * 12) / dailyEarnings : 0;

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setIsLoading(true);
    // Use default opportunities with real price estimates
    // These can be enhanced with SerpAPI searches later
    setOpportunities(getDefaultOpportunities());
    setIsLoading(false);
  };

  const getDefaultOpportunities = (): Opportunity[] => [
    {
      id: "1",
      category: "travel",
      title: "Trip to Japan (2 weeks)",
      price: 4500,
      workingDays: calculateWorkingDays(4500),
      description: "Flights, hotels, food, and experiences in Tokyo, Kyoto, Osaka",
      icon: "travel",
      roi: "High life satisfaction"
    },
    {
      id: "2",
      category: "tech",
      title: "MacBook Pro M3",
      price: 2499,
      workingDays: calculateWorkingDays(2499),
      description: "Productivity boost for work and creative projects",
      icon: "tech",
      roi: "Medium - if work-related"
    },
    {
      id: "3",
      category: "learning",
      title: "Online Bootcamp",
      price: 1500,
      workingDays: calculateWorkingDays(1500),
      description: "12-week coding or design intensive course",
      icon: "learning",
      roi: "High - career advancement"
    },
    {
      id: "4",
      category: "fitness",
      title: "Year Gym + Trainer",
      price: 1800,
      workingDays: calculateWorkingDays(1800),
      description: "Premium gym membership with personal training sessions",
      icon: "fitness",
      roi: "Very high - adds life years"
    },
    {
      id: "5",
      category: "experience",
      title: "Concert VIP + Dinner",
      price: 500,
      workingDays: calculateWorkingDays(500),
      description: "Premium experience with friends or partner",
      icon: "experience",
      roi: "Medium - memories & connection"
    },
    {
      id: "6",
      category: "tech",
      title: "iPhone 16 Pro",
      price: 1199,
      workingDays: calculateWorkingDays(1199),
      description: "Latest smartphone with pro camera system",
      icon: "tech",
      roi: "Low - unless needed for work"
    },
    {
      id: "7",
      category: "travel",
      title: "Weekend City Break",
      price: 800,
      workingDays: calculateWorkingDays(800),
      description: "2-night getaway to a nearby city",
      icon: "travel",
      roi: "Medium - recharge & explore"
    },
    {
      id: "8",
      category: "learning",
      title: "Annual Learning Subscriptions",
      price: 400,
      workingDays: calculateWorkingDays(400),
      description: "Masterclass, Skillshare, or professional courses",
      icon: "learning",
      roi: "High - continuous growth"
    }
  ];

  const categories = [
    { id: "all", label: "All" },
    { id: "travel", label: "Travel" },
    { id: "tech", label: "Tech" },
    { id: "learning", label: "Learning" },
    { id: "fitness", label: "Health" },
    { id: "experience", label: "Experiences" }
  ];

  const filteredOpportunities = selectedCategory && selectedCategory !== "all"
    ? opportunities.filter(o => o.category === selectedCategory)
    : opportunities;

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-2xl font-light tracking-tight">Ideas</h1>
        <p className="text-muted-foreground text-sm font-light mt-1">See what your time could buy</p>
      </div>

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

      {/* Your rate summary */}
      {hasData && (
        <div className="px-6 py-4">
          <div className="bg-foreground text-background rounded-2xl p-5">
            <p className="text-xs opacity-60 font-light">Your yearly buffer capacity</p>
            <p className="text-4xl font-light mt-1">{Math.round(yearlyBufferDays)} days</p>
            <p className="text-xs opacity-60 mt-2 font-light">
              Earning ${dailyEarnings.toFixed(0)}/day toward your buffer
            </p>
            <p className="text-[10px] opacity-40 mt-1 font-light">
              (${freeCash.toLocaleString()}/mo surplus ÷ {WORKING_DAYS_PER_MONTH} working days × 12 months)
            </p>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="px-6 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === "all" ? null : cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-light whitespace-nowrap transition-colors ${
                (cat.id === "all" && !selectedCategory) || selectedCategory === cat.id
                  ? "bg-foreground text-background"
                  : "bg-card border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities list */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOpportunities.map((opp, index) => {
              const Icon = iconMap[opp.icon] || iconMap.default;
              const percentOfBudget = yearlyBufferDays > 0 
                ? (opp.workingDays / yearlyBufferDays) * 100 
                : 0;
              
              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex gap-4">
                    <div className="w-11 h-11 bg-muted/50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-light">{opp.title}</p>
                          <p className="text-xs text-muted-foreground font-light">{opp.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">${opp.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-light">{opp.workingDays.toFixed(1)}d</p>
                          {yearlyBufferDays > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              {percentOfBudget.toFixed(0)}% of year
                            </p>
                          )}
                        </div>
                      </div>
                      {opp.roi && (
                        <div className="mt-2">
                          <span className="text-[10px] bg-foreground/10 px-2 py-0.5 rounded-full font-light">
                            ROI: {opp.roi}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {!isLoading && hasData && (
        <div className="px-6 py-4">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-xs text-muted-foreground font-light">
              These {filteredOpportunities.length} options would cost{" "}
              <span className="font-medium text-foreground">
                {filteredOpportunities.reduce((sum, o) => sum + o.workingDays, 0).toFixed(0)} working days
              </span>
            </p>
            {filteredOpportunities.reduce((sum, o) => sum + o.workingDays, 0) > yearlyBufferDays && (
              <p className="text-[10px] text-destructive mt-1 font-light">
                That's more than your yearly capacity — choose wisely
              </p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Opportunities;