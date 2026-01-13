import { useState, useEffect } from "react";
import { Sparkles, Plane, Laptop, BookOpen, Dumbbell, Coffee, Loader2 } from "lucide-react";
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

  // Get user's financial data
  const income = parseFloat(localStorage.getItem("timecost_income") || "5000");
  const expenses = parseFloat(localStorage.getItem("timecost_expenses") || "3000");
  const netWorth = parseFloat(localStorage.getItem("timecost_networth") || "50000");
  
  const freeCash = income - expenses;
  const monthlyHoursGained = freeCash > 0 ? (freeCash / expenses) * 30 * 24 : 0;
  const yearlyOptionalHours = monthlyHoursGained * 12;
  const hourlyLifeCost = expenses / (30 * 24);

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
          hourlyLifeCost,
          income,
          expenses
        }),
      });

      if (!response.ok) throw new Error("Failed to load");

      const data = await response.json();
      setOpportunities(data.opportunities || getDefaultOpportunities());
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
      hours: Math.round(3000 / hourlyLifeCost),
      description: "2-week adventure exploring Tokyo, Kyoto, and Osaka",
      icon: "travel",
      roi: "High life satisfaction"
    },
    {
      id: "2",
      category: "tech",
      title: "New MacBook Pro",
      hours: Math.round(2500 / hourlyLifeCost),
      description: "Productivity boost for work and creative projects",
      icon: "tech",
      roi: "Medium - if work-related"
    },
    {
      id: "3",
      category: "learning",
      title: "Online Bootcamp",
      hours: Math.round(1500 / hourlyLifeCost),
      description: "12-week coding or design intensive course",
      icon: "learning",
      roi: "High - career advancement"
    },
    {
      id: "4",
      category: "fitness",
      title: "Year Gym Membership",
      hours: Math.round(600 / hourlyLifeCost),
      description: "Investment in health and longevity",
      icon: "fitness",
      roi: "Very high - adds life hours"
    },
    {
      id: "5",
      category: "experience",
      title: "Concert & Dining",
      hours: Math.round(300 / hourlyLifeCost),
      description: "Premium experience with friends or partner",
      icon: "experience",
      roi: "Medium - memories & connection"
    },
    {
      id: "6",
      category: "tech",
      title: "Smart Home Setup",
      hours: Math.round(800 / hourlyLifeCost),
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

  const totalHours = opportunities.reduce((sum, o) => sum + o.hours, 0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Time Opportunities</h1>
        <p className="text-muted-foreground text-sm mt-1">Ways to spend your optional hours</p>
      </div>

      {/* Your budget */}
      <div className="px-6 py-4">
        <div className="bg-foreground text-background rounded-2xl p-5">
          <p className="text-sm opacity-60">Your yearly optional hours</p>
          <p className="text-4xl font-black mt-1">{yearlyOptionalHours.toFixed(0)}</p>
          <p className="text-sm opacity-60 mt-2">
            Based on ${freeCash.toLocaleString()}/mo free cash
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="px-6 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === "all" ? null : cat.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                (cat.id === "all" && !selectedCategory) || selectedCategory === cat.id
                  ? "bg-foreground text-background"
                  : "bg-muted/30"
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
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOpportunities.map((opp, index) => {
              const Icon = iconMap[opp.icon] || iconMap.default;
              const percentOfBudget = (opp.hours / yearlyOptionalHours) * 100;
              
              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-muted/30 rounded-2xl p-4"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{opp.title}</p>
                          <p className="text-sm text-muted-foreground">{opp.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold">{opp.hours}h</p>
                          <p className="text-xs text-muted-foreground">
                            {percentOfBudget.toFixed(0)}% of year
                          </p>
                        </div>
                      </div>
                      {opp.roi && (
                        <div className="mt-2">
                          <span className="text-xs bg-foreground/10 px-2 py-1 rounded-full">
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
      {!isLoading && (
        <div className="px-6 py-4">
          <div className="bg-muted/30 rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              These {filteredOpportunities.length} options would cost{" "}
              <span className="font-bold text-foreground">
                {filteredOpportunities.reduce((sum, o) => sum + o.hours, 0).toLocaleString()} hours
              </span>
            </p>
            {filteredOpportunities.reduce((sum, o) => sum + o.hours, 0) > yearlyOptionalHours && (
              <p className="text-xs text-destructive mt-1">
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
