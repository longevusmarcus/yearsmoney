import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Leaderboard = () => {
  const navigate = useNavigate();

  // Mock leaderboard data - in production this would come from the database
  const leaderboardData = [
    { rank: 1, name: "Anonymous", buffer0: 847, buffer1: 12 },
    { rank: 2, name: "Anonymous", buffer0: 623, buffer1: 8 },
    { rank: 3, name: "Anonymous", buffer0: 512, buffer1: 15 },
    { rank: 4, name: "Anonymous", buffer0: 489, buffer1: 6 },
    { rank: 5, name: "Anonymous", buffer0: 401, buffer1: 9 },
    { rank: 6, name: "Anonymous", buffer0: 356, buffer1: 11 },
    { rank: 7, name: "Anonymous", buffer0: 298, buffer1: 7 },
    { rank: 8, name: "Anonymous", buffer0: 245, buffer1: 4 },
    { rank: 9, name: "Anonymous", buffer0: 189, buffer1: 13 },
    { rank: 10, name: "Anonymous", buffer0: 156, buffer1: 5 },
  ];

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
                <span className={`text-sm font-light w-6 ${
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

              {/* Buffers */}
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-light text-foreground tabular-nums">
                  {user.buffer0}
                </span>
                <span className="text-[10px] text-muted-foreground/50 font-light">
                  /{user.buffer1}
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
