import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ReviewCard, ReviewCardData } from "@/components/ReviewCard";
import { LetterGrade } from "@/components/GradePill";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import { getRank, getNextRank } from "@/lib/ranks";
import { Avatar } from "@/components/Avatar";

type PublicProfile = {
  id: string;
  display_name: string;
  supported_team: string | null;
  avatar_url: string | null;
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, display_name, supported_team")
        .eq("id", id)
        .maybeSingle();
      setProfile(p);

      const { data: matches } = await supabase
        .from("matches")
        .select("*, stadium:stadiums(id,name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      const count = matches?.length ?? 0;
      setMatchCount(count);
      setReviews((matches ?? []).map((m: any) => ({
        ...m,
        profile: p ? { ...p, match_count: count } : null,
      })));

      if (user) {
        const { data: follow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", id)
          .maybeSingle();
        setIsFollowing(!!follow);
      }

      setLoading(false);
    })();
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user || !id) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", user.id)
        .eq("following_id", id);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: id,
      });
      setIsFollowing(true);
      await supabase.from("notifications").insert({
        user_id: id,
        actor_id: user.id,
        type: "follow",
        match_id: null,
      });
    }
    setFollowLoading(false);
  };

  const rank = getRank(matchCount);
  const nextRank = getNextRank(matchCount);

  const overall = reviews.length
    ? reviews.reduce((s, r) => s + (r.atmosphere + r.view_rating + r.scran + r.damage) / 4, 0) / reviews.length
    : 0;

  const motmLeaderboard = Object.entries(
    reviews.reduce((acc, r) => {
      if (!r.motm_player) return acc;
      acc[r.motm_player] = (acc[r.motm_player] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const isOwnProfile = user?.id === id;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !profile ? (
          <p className="text-center text-muted-foreground py-16">User not found.</p>
        ) : (
          <>
            {/* Header */}
            <div className="stat-card flex items-center gap-4">
              <Avatar url={profile.avatar_url} name={profile.display_name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-xl truncate">@{profile.display_name}</p>
                <p className="text-sm text-muted-foreground">{profile.supported_team ?? "No team"}</p>
                <span className={`text-sm font-extrabold uppercase tracking-wider ${rank.color}`}>
                  {rank.label}
                </span>
              </div>
              {!isOwnProfile && user && (
                <Button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={isFollowing
                    ? "bg-secondary text-foreground font-extrabold"
                    : "bg-gradient-primary text-primary-foreground font-extrabold shadow-glow"
                  }
                >
                  {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? "Unfollow" : "Follow"}
                </Button>
              )}
            </div>

            {/* Rank progress */}
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
                      style={{ width: `${Math.min((matchCount / nextRank.rank.minMatches) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{nextRank.matchesNeeded} more {nextRank.matchesNeeded === 1 ? "match" : "matches"} to reach {nextRank.rank.label}</p>
                </>
              ) : (
                <p className="text-xs text-primary font-extrabold">Maximum rank achieved. Legend status. 🏆</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card flex flex-col items-center text-center">
                <span className="font-display text-5xl tracking-wider leading-none">{matchCount}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Matches Logged</span>
              </div>
              <div className="stat-card flex flex-col items-center text-center gap-2">
                {reviews.length > 0
                  ? <LetterGrade value={overall} size="md" />
                  : <span className="font-display text-5xl text-muted-foreground">–</span>}
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Grade Given</span>
              </div>
            </div>

            {/* MOTM Picks */}
            {motmLeaderboard.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-2xl tracking-wider">MOTM Picks</h2>
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

            {/* Reviews */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl tracking-wider">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                reviews.map(r => (
                  <ReviewCard
                    key={r.id}
                    data={r}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default UserProfile;