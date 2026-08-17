import { Trophy } from "lucide-react";
import { useMemo } from "react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import MobileOnly from "@/components/MobileOnly";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useI18n } from "@/i18n/I18nProvider";

const Leaderboard = () => {
  // Signed-in visitors get their own ranked row; signed-out ones see the list as-is.
  const { finances, user } = useUserFinances();
  const { t } = useI18n();
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
        isCurrentUser: false,
      });
    }

    // Signed in and with real numbers entered → slot the visitor into the ranking.
    // Same buffer formulas as above so the comparison is apples to apples.
    if (user && finances.netWorth > 0 && finances.monthlyIncome > 0) {
      users.push({
        rank: 0,
        name: t("app.leaderboard.you"),
        buffer0Years: finances.netWorth / (finances.monthlyIncome * 12),
        buffer1Years:
          finances.monthlyExpenses > 0
            ? finances.netWorth / (finances.monthlyExpenses * 12)
            : 0,
        isCurrentUser: true,
      });
    }

    // Sort by buffer0 descending
    return users.sort((a, b) => b.buffer0Years - a.buffer0Years).map((u, i) => ({
      ...u,
      rank: i + 1
    }));
  }, [user, finances.netWorth, finances.monthlyIncome, finances.monthlyExpenses, t]);

  const formatYears = (years: number) => {
    if (years >= 1) {
      return years.toFixed(1);
    }
    return years.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <PageHeader 
        title={t("app.leaderboard.title")}
        subtitle={t("app.leaderboard.sub")}
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
                  user.isCurrentUser
                    ? "logo-gradient-text inline-block font-display"
                    : user.rank <= 3 ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {user.rank}
                </span>
                <div className="flex items-center gap-3">
                  {/* Trophy stays a top-3 marker; on the visitor's own row it turns gold
                      rather than appearing at any rank, which would misread as a win. */}
                  {user.rank <= 3 && (
                    <Trophy
                      className={`w-4 h-4 ${
                        user.isCurrentUser
                          ? "text-[oklch(0.85_0.19_90)]"
                          : user.rank === 1
                            ? "text-foreground"
                            : user.rank === 2
                              ? "text-muted-foreground/70"
                              : "text-muted-foreground/50"
                      }`}
                      strokeWidth={1.5}
                    />
                  )}
                  <span className={`text-sm ${
                    user.isCurrentUser
                      ? "logo-gradient-text inline-block font-display"
                      : "font-light text-foreground"
                  }`}>
                    {user.name}
                  </span>
                </div>
              </div>

              {/* Buffers in Years */}
              <div className="flex items-baseline gap-1">
                <span className={`text-lg tabular-nums ${
                  user.isCurrentUser
                    ? "logo-gradient-text inline-block font-display"
                    : "font-light text-foreground"
                }`}>
                  {formatYears(user.buffer0Years)}
                </span>
                <span className={`text-[10px] font-light ${
                  user.isCurrentUser
                    ? "logo-gradient-text inline-block"
                    : "text-muted-foreground/50"
                }`}>
                  {t("common.yearShort")}
                </span>
                <span className={`text-[10px] font-light ml-1 ${
                  user.isCurrentUser
                    ? "logo-gradient-text inline-block"
                    : "text-muted-foreground/30"
                }`}>
                  /{formatYears(user.buffer1Years)}{t("common.yearShort")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}  
        <div className="pt-8 pb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/40 font-light text-center">
            {t("app.leaderboard.footer")}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
