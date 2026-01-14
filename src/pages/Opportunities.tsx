import { useState, useEffect } from "react";
import { Sparkles, Plane, Laptop, BookOpen, Dumbbell, Coffee, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";

interface Opportunity {
  id: string;
  category: string;
  title: string;
  hours: number;
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

  // Calculate hours based on life advancement rate
  // Hours = (price / freeCash) * hours_per_month
  const calculateHours = (priceValue: number) => {
    if (freeCash <= 0) {
      return expenses > 0 ? (priceValue / expenses) * 30 * 24 : 0;
    }
    return (priceValue / freeCash) * 30 * 24;
  };

  // Yearly optional hours = hours gained per month * 12
  const monthlyHoursGained = freeCash > 0 ? (freeCash / expenses) * 30 * 24 : 0;
  const yearlyOptionalHours = monthlyHoursGained * 12;

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-advisor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "opportunities",
          yearlyOptionalHours,
          freeCash,
          income,
          expenses
        }),
      });

      if (!response.ok) throw new Error("Failed to load");

      const data = await response.json();
      // Recalculate hours using our formula
      const opps = (data.opportunities || getDefaultOpportunities()).map((opp: any) => ({
        ...opp,
        hours: opp.price ? calculateHours(opp.price) : opp.hours
      }));
      setOpportunities(opps);
    } catch (error) {
      setOpportunities(getDefaultOpportunities());
    }
    
    setIsLoading(false);
  };

  const getDefaultOpportunities = (): Opportunity[] => [
    {
      id: "1",
      category: "travel",
      title: "Trip to Japan",
      hours: Math.round(calculateHours(3000)),
      description: "2-week adventure exploring Tokyo, Kyoto, and Osaka",
      icon: "travel",
      roi: "High life satisfaction"
    },
    {
      id: "2",
      category: "tech",
      title: "New MacBook Pro",
      hours: Math.round(calculateHours(2500)),
      description: "Productivity boost for work and creative projects",
      icon: "tech",
      roi: "Medium - if work-related"
    },
    {
      id: "3",
      category: "learning",
      title: "Online Bootcamp",
      hours: Math.round(calculateHours(1500)),
      description: "12-week coding or design intensive course",
      icon: "learning",
      roi: "High - career advancement"
    },
    {
      id: "4",
      category: "fitness",
      title: "Year Gym Membership",
      hours: Math.round(calculateHours(600)),
      description: "Investment in health and longevity",
      icon: "fitness",
      roi: "Very high - adds life hours"
    },
    {
      id: "5",
      category: "experience",
      title: "Concert & Dining",
      hours: Math.round(calculateHours(300)),
      description: "Premium experience with friends or partner",
      icon: "experience",
      roi: "Medium - memories & connection"
    },
    {
      id: "6",
      category: "tech",
      title: "Smart Home Setup",
      hours: Math.round(calculateHours(800)),
      description: "Automate your home, save daily minutes",
      icon: "tech",
      roi: "Medium - saves 5-10 hours/year"
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
        <p className="text-muted-foreground text-sm font-light mt-1">Ways to spend your optional hours</p>
      </div>

      {/* Warning if no data */}
      {!hasData && (
        <div className="px-6 mb-4">
          <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground font-light">
              Add your income and expenses on the Home page for personalized suggestions.
            </p>
          </div>
        </div>
      )}

      {/* Your budget */}
      {hasData && (
        <div className="px-6 py-4">
          <div className="bg-foreground text-background rounded-2xl p-5">
            <p className="text-xs opacity-60 font-light">Your yearly optional hours</p>
            <p className="text-4xl font-light mt-1">{Math.round(yearlyOptionalHours).toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-2 font-light">
              Based on ${freeCash.toLocaleString()}/mo free cash
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
              const percentOfBudget = yearlyOptionalHours > 0 
                ? (opp.hours / yearlyOptionalHours) * 100 
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
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-light">{opp.hours.toLocaleString()}h</p>
                          {yearlyOptionalHours > 0 && (
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
                {filteredOpportunities.reduce((sum, o) => sum + o.hours, 0).toLocaleString()} hours
              </span>
            </p>
            {filteredOpportunities.reduce((sum, o) => sum + o.hours, 0) > yearlyOptionalHours && (
              <p className="text-[10px] text-destructive mt-1 font-light">
                That's more than your yearly budget — choose wisely
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