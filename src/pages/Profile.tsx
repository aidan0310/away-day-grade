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
            reviews.map(r => (
              <ReviewCard
                key={r.id}
                data={r}
                onDeleted={(id) => setReviews((rs) => rs.filter((x) => x.id !== id))}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
};


// Counts MOTM votes by player for the current PL season (Aug 1 → Jul 31).
const SeasonMotmLeaderboard = ({ reviews }: { reviews: ReviewCardData[] }) => {
  const top = useMemo(() => {
    const now = new Date();
    const seasonStartYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const start = new Date(seasonStartYear, 7, 1); // Aug 1
    const end = new Date(seasonStartYear + 1, 6, 31); // Jul 31

    const counts = new Map<string, number>();
    for (const r of reviews) {
      if (!r.motm_player) continue;
      const d = new Date(r.match_date);
      if (d < start || d > end) continue;
      counts.set(r.motm_player, (counts.get(r.motm_player) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [reviews]);

  if (!top.length) return null;
  const max = top[0][1];

  return (
    <div className="stat-card space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl tracking-wider">Your MOTM XI · This Season</h2>
      </div>
      <ol className="space-y-2">
        {top.map(([name, count], i) => (
          <li key={name} className="flex items-center gap-3">
            <span className="font-display text-lg tracking-wider w-6 text-muted-foreground">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-sm truncate">{name}</p>
              <div className="h-1.5 mt-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-primary"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
            <span className="font-display text-xl tracking-wider text-primary">{count}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Profile;
