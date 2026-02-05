import { Trophy } from "lucide-react";
import { useMemo } from "react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";

const Leaderboard = () => {
  // Realistic human names
  const names = [
    "Marcus Chen", "Sofia Rodriguez", "James O'Brien", "Aisha Patel", "Lucas Andersen",
    "Emma Nakamura", "David Kim", "Olivia Martinez", "Noah Williams", "Isabella Costa",
    "Ethan Johansson", "Mia Thompson", "Alexander Müller", "Charlotte Singh", "Benjamin Lee",
    "Amelia Garcia", "William Brown", "Harper Tanaka", "Henry Davis", "Evelyn Rossi",
    "Sebastian Wright", "Abigail Fernandez", "Jack Morrison", "Emily Larsson", "Owen Clark",
    "Avery Hassan", "Liam Scott", "Ella Dubois", "Mason Pham", "Scarlett Jensen",
    "Logan Rivera", "Grace Liu", "Jacob Moore", "Chloe Kowalski", "Michael Santos",
    "Lily Bergström", "Daniel Nguyen", "Zoey Walsh", "Matthew Hernandez", "Aria Svensson",
    "Jackson Turner", "Penelope Sharma", "Aiden Cooper", "Layla Fischer", "Samuel Reed",
    "Riley Yamamoto", "Joseph Bell", "Nora Eriksen", "Luke Foster", "Hannah Moreau"
  ];

  // Abbreviate name to 3-4 chars each (e.g., "Marc. Chen")
  const abbreviateName = (fullName: string) => {
    return fullName.slice(0, 3) + "...";
  };

  // Generate 50 users with varied financials
  const leaderboardData = useMemo(() => {
    const users = [];
    
    // Base values for top user
    const baseNetWorth = 1_000_000;
    const baseIncome = 20_000;
    const baseExpenses = 10_000;

    for (let i = 0; i < 50; i++) {
      // Decrease net worth by ~5-8% each rank (with some randomness via seed)
      const decayFactor = Math.pow(0.94 - (i % 3) * 0.01, i);
      const netWorth = baseNetWorth * decayFactor;
      
      // Vary expense ratio (some people spend more, some less relative to income)
      const expenseVariation = 0.4 + ((i * 7) % 10) / 20; // 0.4 to 0.85 of income
      const incomeDecay = Math.pow(0.97, i * 0.8);
      const monthlyIncome = baseIncome * incomeDecay;
      const monthlyExpenses = monthlyIncome * expenseVariation;

      // Buffer 0 = Net Worth / Annual Income (lower - based on maintaining lifestyle)
      const buffer0 = netWorth / (monthlyIncome * 12);
      // Buffer 1 = Net Worth / Annual Expenses (higher - survival mode)  
      const buffer1 = netWorth / (monthlyExpenses * 12);

      users.push({
        rank: i + 1,
        name: abbreviateName(names[i]),
        buffer0Years: buffer0,
        buffer1Years: buffer1,
      });
    }

    // Sort by buffer0 descending
    return users.sort((a, b) => b.buffer0Years - a.buffer0Years).map((u, i) => ({
      ...u,
      rank: i + 1
    }));
  }, []);

  const formatYears = (years: number) => {
    if (years >= 1) {
      return years.toFixed(1);
    }
    return years.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader 
        title="Leaderboard" 
        subtitle="Ranked by life buffers, not money"
      />

      <div className="px-6 space-y-0">
        {/* Leaderboard List */}
        <div>
          {leaderboardData.map((user, index) => (
            <div
              key={user.rank}
              className={`flex items-center justify-between py-5 ${
                index !== leaderboardData.length - 1 ? "border-b border-border/30" : ""
              }`}
            >
              {/* Rank & Name */}
              <div className="flex items-center gap-5">
                <span className={`text-sm font-light w-6 tabular-nums ${
                  user.rank <= 3 ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {user.rank}
                </span>
                <div className="flex items-center gap-3">
                  {user.rank <= 3 && (
                    <Trophy 
                      className={`w-4 h-4 ${
                        user.rank === 1 
                          ? "text-foreground" 
                          : user.rank === 2 
                            ? "text-muted-foreground/70" 
                            : "text-muted-foreground/50"
                      }`} 
                      strokeWidth={1.5} 
                    />
                  )}
                  <span className="text-sm font-light text-foreground">
                    {user.name}
                  </span>
                </div>
              </div>

              {/* Buffers in Years */}
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-light text-foreground tabular-nums">
                  {formatYears(user.buffer0Years)}
                </span>
                <span className="text-[10px] text-muted-foreground/50 font-light">
                  y
                </span>
                <span className="text-[10px] text-muted-foreground/30 font-light ml-1">
                  /{formatYears(user.buffer1Years)}y
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}  
        <div className="pt-8 pb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/40 font-light text-center">
            Buffer 0 · Buffer 1
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
