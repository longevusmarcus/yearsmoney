-- Add leaderboard display preference to profiles
-- 'anonymous' = show first 3 letters + dots
-- 'public' = show full name
ALTER TABLE public.profiles 
ADD COLUMN leaderboard_display text NOT NULL DEFAULT 'anonymous' 
CHECK (leaderboard_display IN ('anonymous', 'public'));