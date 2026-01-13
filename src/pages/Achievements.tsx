import { ArrowLeft, Heart, Shield, Crown, Target, Star, Flame, Ear, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { getGamificationData } from "@/utils/gamification";
import { useState, useEffect } from "react";

const Achievements = () => {
  const navigate = useNavigate();
  const [gamData, setGamData] = useState(getGamificationData());
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    setGamData(getGamificationData());
    const storedEntries = JSON.parse(localStorage.getItem("gutEntries") || "[]");
    setEntries(storedEntries);
  }, []);

  const honoredCount = entries.filter(e => e.willIgnore === "no").length;
  const decisionsTracked = entries.filter(e => e.decision).length;
  const consequencesLogged = entries.filter(e => e.consequence).length;

  const allAchievements = [
    {
      id: "first_listen",
      name: "First Listen",
      description: "Complete your first check-in",
      xp: 10,
      icon: Ear,
      condition: { type: "checkins", value: 1 },
      progress: gamData.totalCheckins
    },
    {
      id: "gut_honor",
      name: "Gut Honor",
      description: "Honor your gut feeling for the first time",
      xp: 25,
      icon: Heart,
      condition: { type: "honored", value: 1 },
      progress: honoredCount
    },
    {
      id: "streak_3",
      name: "Consistent Listener",
      description: "Maintain a 3-day check-in streak",
      xp: 30,
      icon: Flame,
      condition: { type: "streak", value: 3 },
      progress: gamData.currentStreak
    },
    {
      id: "decision_tracker",
      name: "Decision Tracker",
      description: "Track your first decision",
      xp: 30,
      icon: Target,
      condition: { type: "decisions", value: 1 },
      progress: decisionsTracked
    },
    {
      id: "pattern_master",
      name: "Pattern Master",
      description: "Log outcomes for 5 decisions",
      xp: 100,
      icon: Star,
      condition: { type: "consequences", value: 5 },
      progress: consequencesLogged
    },
    {
      id: "trust_builder",
      name: "Trust Builder",
      description: "Honor your gut 5 times",
      xp: 50,
      icon: Shield,
      condition: { type: "honored", value: 5 },
      progress: honoredCount
    },
    {
      id: "intuition_master",
      name: "Intuition Master",
      description: "Honor your gut 15 times",
      xp: 150,
      icon: Crown,
      condition: { type: "honored", value: 15 },
      progress: honoredCount
    }
  ];

  const isUnlocked = (achievementId: string) => {
    return gamData.achievements.some(a => a.id === achievementId);
  };

  const getProgressPercentage = (achievement: any) => {
    return Math.min((achievement.progress / achievement.condition.value) * 100, 100);
  };

  const unlockedCount = allAchievements.filter(a => isUnlocked(a.id)).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-cursive text-foreground tracking-tight">Achievements</h1>
          <p className="text-base text-muted-foreground font-light">
            {unlockedCount} of {allAchievements.length} unlocked
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="bg-card border-border p-6 rounded-3xl">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-light">Overall Progress</span>
              <span className="text-sm text-foreground font-medium">{Math.round((unlockedCount / allAchievements.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / allAchievements.length) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Achievements Grid */}
        <div className="space-y-3">
          {allAchievements.map((achievement) => {
            const Icon = achievement.icon;
            const unlocked = isUnlocked(achievement.id);
            const progressPercent = getProgressPercentage(achievement);

            return (
              <Card 
                key={achievement.id} 
                className={`p-6 rounded-3xl transition-all ${
                  unlocked 
                    ? 'bg-card border-border' 
                    : 'bg-card/50 border-border/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {unlocked ? (
                    <Icon className="w-7 h-7 text-foreground flex-shrink-0" strokeWidth={1.5} />
                  ) : (
                    <Lock className="w-7 h-7 text-muted-foreground/50 flex-shrink-0" strokeWidth={1.5} />
                  )}
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className={`text-lg font-medium ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-light mt-1">
                        {achievement.description}
                      </p>
                    </div>

                    {!unlocked && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-light">
                            {achievement.progress} / {achievement.condition.value}
                          </span>
                          <span className="text-muted-foreground font-light">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-muted-foreground rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className={`text-xs font-medium ${unlocked ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      +{achievement.xp} XP
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Achievements;