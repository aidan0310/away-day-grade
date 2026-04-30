import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ReviewCard, ReviewCardData } from "@/components/ReviewCard";
import { LetterGrade } from "@/components/GradePill";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Trophy } from "lucide-react";

const Profile = () => {
  const nav = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("*, stadium:stadiums(id,name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReviews((matches ?? []).map((m: any) => ({ ...m, profile })));
      setLoading(false);
    })();
  }, [user, profile]);

  const overall = reviews.length
    ? reviews.reduce((s, r) => s + (r.atmosphere + r.view_rating + r.scran + r.damage) / 4, 0) / reviews.length
    : 0;

  const onSignOut = async () => {
    await signOut();
    nav("/auth");
  };

  return (
    <AppShell title="Profile" right={
      <Button variant="ghost" size="icon" onClick={onSignOut}><LogOut className="h-5 w-5" /></Button>
    }>
      <div className="space-y-6">
        <div className="stat-card flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display text-2xl">
            {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-xl truncate">@{profile?.display_name}</p>
            <p className="text-sm text-muted-foreground">{profile?.supported_team ?? "No team yet"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card flex flex-col items-center text-center">
            <span className="font-display text-5xl tracking-wider leading-none">{reviews.length}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Matches Logged</span>
          </div>
          <div className="stat-card flex flex-col items-center text-center gap-2">
            {reviews.length > 0
              ? <LetterGrade value={overall} size="md" />
              : <span className="font-display text-5xl text-muted-foreground">–</span>}
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Grade Given</span>
          </div>
        </div>

        <SeasonMotmLeaderboard reviews={reviews} />

        <div className="space-y-3">
          <h2 className="font-display text-2xl tracking-wider">Your Match Diary</h2>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet. Hit + to log one.</p>
          ) : (
            reviews.map(r => <ReviewCard key={r.id} data={r} />)
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
