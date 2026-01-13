import { Award, Settings, HelpCircle, LogOut, Edit, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getGamificationData, calculateLevel, getLevelName, getRecentAchievements, formatTimeAgo } from "@/utils/gamification";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<{ first_name: string | null; last_name: string | null; nickname: string | null; avatar_url: string | null } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [gamData, setGamData] = useState(getGamificationData());
  const [recentAchievements, setRecentAchievements] = useState(getRecentAchievements(3));

  const levelInfo = calculateLevel(gamData.totalXP);
  const levelName = getLevelName(levelInfo.level);

  useEffect(() => {
    fetchProfile();
    // Refresh gamification data
    setGamData(getGamificationData());
    setRecentAchievements(getRecentAchievements(3));
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      setProfile(data);
      if (data) {
        setNickname(data.nickname || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: nickname,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({ ...profile, nickname: nickname });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: Settings, label: "Settings", action: () => navigate("/settings") },
    { icon: HelpCircle, label: "Help & Support", action: () => navigate("/help") },
    { icon: LogOut, label: "Sign Out", action: handleSignOut },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-medium">
                  {profile?.nickname?.[0] || profile?.first_name?.[0] || "U"}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            {isEditing ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <Input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-background border-border rounded-[1.25rem]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    className="flex-1 rounded-[1.25rem]"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1 rounded-[1.25rem]"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-cursive text-foreground tracking-tight">
                  {loading ? "Loading..." : profile?.nickname || "Your Profile"}
                </h1>
                <p className="text-base text-muted-foreground font-light mt-2">Level {levelInfo.level} {levelName}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 hover:bg-card rounded-full transition-colors mx-auto mt-2 block"
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* XP Progress */}
        <Card className="bg-card border-border p-6 rounded-3xl">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-light">Progress to Level {levelInfo.level + 1}</p>
                <p className="text-base font-medium text-foreground">{gamData.totalXP} / {levelInfo.nextLevelXP} XP</p>
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${Math.min(levelInfo.progress, 100)}%` }} />
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border p-6 rounded-3xl text-center">
            <p className="text-3xl font-medium text-foreground mb-1">{gamData.currentStreak}</p>
            <p className="text-sm text-muted-foreground font-light">Day Streak</p>
          </Card>
          <Card className="bg-card border-border p-6 rounded-3xl text-center">
            <p className="text-3xl font-medium text-foreground mb-1">{gamData.totalCheckins}</p>
            <p className="text-sm text-muted-foreground font-light">Check-ins</p>
          </Card>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Recent Achievements</h2>
            <button
              onClick={() => navigate("/achievements")}
              className="text-sm text-primary font-light hover:underline"
            >
              View all
            </button>
          </div>
          
          {recentAchievements.length === 0 ? (
            <Card className="bg-card border-border p-6 rounded-2xl">
              <p className="text-sm text-muted-foreground font-light text-center">
                Start checking in to unlock achievements
              </p>
            </Card>
          ) : (
            recentAchievements.map((achievement) => (
              <Card key={achievement.id} className="bg-card border-border p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-foreground">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground font-light">{formatTimeAgo(achievement.unlockedAt)}</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">+{achievement.xp} XP</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Menu Items */}
        <div className="space-y-2 pt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-card transition-colors"
              >
                <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-base font-light text-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
