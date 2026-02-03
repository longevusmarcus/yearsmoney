import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import BottomNav from "@/components/BottomNav";

const Leaderboard = () => {
  const navigate = useNavigate();

  // Generate 50 users, each 3% less than previous
  // Starting: 1M net worth, 20k/month income, 10k/month expenses
  const leaderboardData = useMemo(() => {
    const users = [];
    let netWorth = 1_000_000;
    let monthlyIncome = 20_000;
    let monthlyExpenses = 10_000;

    for (let i = 0; i < 50; i++) {
      // Buffer 0 = Net Worth / Annual Expenses (survival years)
      const buffer0 = netWorth / (monthlyExpenses * 12);
      // Buffer 1 = Net Worth / Annual Income (lifestyle years)
      const buffer1 = netWorth / (monthlyIncome * 12);

      users.push({
        rank: i + 1,
        name: "Anonymous",
        buffer0Years: buffer0,
        buffer1Years: buffer1,
      });

      // Reduce all values by 3% for next user
      netWorth *= 0.97;
      monthlyIncome *= 0.97;
      monthlyExpenses *= 0.97;
    }

    return users;
  }, []);

  const formatYears = (years: number) => {
    if (years >= 1) {
      return years.toFixed(1);
    }
    return years.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/60 font-light">
            Global Ranking
          </span>
          <h1 className="text-3xl font-light text-foreground tracking-tight">
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground/70 font-light leading-relaxed max-w-sm">
            Ranked by life buffers, not money
          </p>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-0">
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
        <div className="pt-4">
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
