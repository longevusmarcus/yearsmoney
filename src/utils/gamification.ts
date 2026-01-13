interface GamificationData {
  totalXP: number;
  totalCheckins: number;
  currentStreak: number;
  lastCheckInDate: string | null;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  xp: number;
  unlockedAt: string;
  icon: string;
}

const STORAGE_KEY = "gamification_data";

export const getGamificationData = (): GamificationData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      totalXP: 0,
      totalCheckins: 0,
      currentStreak: 0,
      lastCheckInDate: null,
      achievements: [],
    };
  }
  
  const parsedData = JSON.parse(data);
  
  // Only check for expired streaks if user has a streak
  if (parsedData.lastCheckInDate && parsedData.currentStreak > 0) {
    const lastDate = new Date(parsedData.lastCheckInDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset normalized dates to midnight for accurate comparison
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    const lastDateStr = lastDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    // Streak is still active if checked in today or yesterday
    if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
      return parsedData;
    }
    
    // Streak broken - reset to 0
    return {
      ...parsedData,
      currentStreak: 0
    };
  }
  
  return parsedData;
};

const saveGamificationData = (data: GamificationData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const calculateLevel = (xp: number): { level: number; nextLevelXP: number; progress: number } => {
  // XP needed: Level 1: 0-100, Level 2: 100-250, Level 3: 250-500, etc.
  const levels = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];
  
  let level = 1;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentLevelXP = levels[level - 1] || 0;
  const nextLevelXP = levels[level] || currentLevelXP + 2000;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  
  return { level, nextLevelXP, progress };
};

export const getLevelName = (level: number): string => {
  const names = [
    "The Listener",
    "The Aware",
    "The Seeker",
    "The Trusting",
    "The Intuitive",
    "The Aligned",
    "The Wise",
    "The Centered",
    "The Awakened",
    "The Master"
  ];
  return names[level - 1] || "The Master";
};

export const addCheckIn = (xp: number): GamificationData => {
  const data = getGamificationData();
  const today = new Date().toDateString();
  
  // Update XP and check-ins
  data.totalXP += xp;
  data.totalCheckins += 1;
  
  // Update streak
  if (data.lastCheckInDate) {
    const lastDate = new Date(data.lastCheckInDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate.toDateString() === yesterday.toDateString()) {
      // Consecutive day
      data.currentStreak += 1;
    } else if (lastDate.toDateString() === today) {
      // Already checked in today, don't update streak
    } else {
      // Streak broken
      data.currentStreak = 1;
    }
  } else {
    // First check-in
    data.currentStreak = 1;
  }
  
  data.lastCheckInDate = today;
  
  // Check for new achievements
  checkAchievements(data);
  
  saveGamificationData(data);
  return data;
};

export const adjustXP = (xpChange: number): GamificationData => {
  const data = getGamificationData();
  
  // Update XP (can be positive or negative)
  data.totalXP = Math.max(0, data.totalXP + xpChange); // Never go below 0
  
  // Check for new achievements
  checkAchievements(data);
  
  saveGamificationData(data);
  return data;
};

const checkAchievements = (data: GamificationData) => {
  // Get entries to check gut-following stats
  const entries = JSON.parse(localStorage.getItem("gutEntries") || "[]");
  const honoredCount = entries.filter((e: any) => e.willIgnore === "no").length;
  const decisionsTracked = entries.filter((e: any) => e.decision).length;
  const consequencesLogged = entries.filter((e: any) => e.consequence).length;
  
  const achievements: { id: string; name: string; description: string; xp: number; condition: () => boolean; icon: string }[] = [
    {
      id: "first_listen",
      name: "First Listen",
      description: "Completed your first check-in",
      xp: 10,
      condition: () => data.totalCheckins === 1,
      icon: "Ear"
    },
    {
      id: "streak_3",
      name: "Consistent Listener",
      description: "Maintained a 3-day check-in streak",
      xp: 30,
      condition: () => data.currentStreak === 3,
      icon: "Flame"
    },
    {
      id: "decision_tracker",
      name: "Decision Tracker",
      description: "Tracked your first decision",
      xp: 30,
      condition: () => decisionsTracked === 1,
      icon: "Target"
    },
    {
      id: "pattern_master",
      name: "Pattern Master",
      description: "Logged outcomes for 5 decisions",
      xp: 100,
      condition: () => consequencesLogged === 5,
      icon: "Star"
    },
    {
      id: "gut_honor",
      name: "Gut Honor",
      description: "Honored your gut feeling for the first time",
      xp: 25,
      condition: () => honoredCount === 1,
      icon: "Heart"
    },
    {
      id: "trust_builder",
      name: "Trust Builder",
      description: "Honored your gut 5 times",
      xp: 50,
      condition: () => honoredCount === 5,
      icon: "Shield"
    },
    {
      id: "intuition_master",
      name: "Intuition Master",
      description: "Honored your gut 15 times",
      xp: 150,
      condition: () => honoredCount === 15,
      icon: "Crown"
    }
  ];
  
  const now = new Date().toISOString();
  
  for (const achievement of achievements) {
    const alreadyUnlocked = data.achievements.some(a => a.id === achievement.id);
    if (!alreadyUnlocked && achievement.condition()) {
      data.achievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        xp: achievement.xp,
        unlockedAt: now,
        icon: achievement.icon
      });
      data.totalXP += achievement.xp;
    }
  }
};

export const getRecentAchievements = (limit: number = 3): Achievement[] => {
  const data = getGamificationData();
  return data.achievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, limit);
};

export const formatTimeAgo = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};