import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ReviewCard, ReviewCardData } from "@/components/ReviewCard";
import { LetterGrade } from "@/components/GradePill";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { getRank, getNextRank } from "@/lib/ranks";

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

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", user.id);
      setFollowerCount(count ?? 0);
    })();
  }, [user]);

  const overall = reviews.length
    ? reviews.reduce((s, r) => s + (r.atmosphere + r.view_rating + r.scran + r.damage) / 4, 0) / reviews.length
    : 0;

  const rank = getRank(reviews.length);
  const nextRank = getNextRank(reviews.length);
  const [followerCount, setFollowerCount] = useState(0);

const motmLeaderboard = Object.entries(
  reviews.reduce((acc, r) => {
    if (!r.motm_player) return acc;
    acc[r.motm_player] = (acc[r.motm_player] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>)
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

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
            <span className={`text-sm font-extrabold uppercase tracking-wider ${rank.color}`}>{rank.label}</span>
            <button
              onClick={() => nav("/profile/followers")}
              className="text-xs text-muted-foreground mt-0.5 hover:text-primary transition-colors text-left block"
            >
              <span className="font-extrabold text-foreground">{followerCount}</span> {followerCount === 1 ? "follower" : "followers"}
            </button>
          </div>
        </div>

        {/* Rank card */}
        <div className="stat-card space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Terrace Rank</p>
            <span className={`text-sm font-extrabold uppercase tracking-wider ${rank.color}`}>{rank.label}</span>
          </div>
          {nextRank ? (
            <>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-gradient-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((reviews.length / nextRank.rank.minMatches) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {nextRank.matchesNeeded} more {nextRank.matchesNeeded === 1 ? "match" : "matches"} to reach {nextRank.rank.label}
              </p>
            </>
          ) : (
            <p className="text-xs text-primary font-extrabold">Maximum rank achieved. Legend status. 🏆</p>
          )}
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

        {motmLeaderboard.length > 0 && (
  <div className="space-y-3">
    <h2 className="font-display text-2xl tracking-wider">Your MOTM Picks</h2>
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="grid grid-cols-[2rem_1fr_3rem] gap-3 px-4 py-3 bg-secondary/60 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Times</span>
      </div>
      {motmLeaderboard.map(([player, count], i) => (
        <div key={player} className="grid grid-cols-[2rem_1fr_3rem] gap-3 px-4 py-3 items-center border-t border-border/60">
          <span className={`font-display text-xl tracking-wider ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
            {i + 1}
          </span>
          <span className="font-extrabold truncate">{player}</span>
          <span className="text-right font-display text-xl tracking-wider text-primary">{count}</span>
        </div>
      ))}
    </div>
  </div>
)}

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
                onDeleted={(id) => setReviews(rs => rs.filter(x => x.id !== id))}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
