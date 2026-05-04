import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ReviewCard, ReviewCardData } from "@/components/ReviewCard";
import { LetterGrade } from "@/components/GradePill";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

const MatchDetail = () => {
  const { key } = useParams<{ key: string }>();
  const nav = useNavigate();
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const decoded = decodeURIComponent(key ?? "");
  const [opponent, matchDate, competition] = decoded.split("__");

  useEffect(() => {
    if (!opponent || !matchDate) return;
    (async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("*, stadium:stadiums(id,name)")
        .eq("opponent", opponent)
        .eq("match_date", matchDate)
        .eq("competition", competition ?? "Premier League")
        .order("created_at", { ascending: false });

      if (!matches) { setLoading(false); return; }

      const userIds = [...new Set(matches.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, supported_team, avatar_url")
        .in("id", userIds);

      const { data: matchCounts } = await supabase
        .from("matches")
        .select("user_id")
        .in("user_id", userIds);

      const countMap = new Map<string, number>();
      (matchCounts ?? []).forEach((m: any) => {
        countMap.set(m.user_id, (countMap.get(m.user_id) ?? 0) + 1);
      });

      const { data: likes } = await supabase
        .from("likes")
        .select("match_id, user_id")
        .in("match_id", matches.map((m: any) => m.id));

      const likeCountMap = new Map<string, number>();
      const userLikedSet = new Set<string>();
      (likes ?? []).forEach((l: any) => {
        likeCountMap.set(l.match_id, (likeCountMap.get(l.match_id) ?? 0) + 1);
      });

      const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      setReviews(matches.map((m: any) => ({
        ...m,
        profile: pmap.get(m.user_id)
          ? { ...pmap.get(m.user_id), match_count: countMap.get(m.user_id) ?? 0 }
          : null,
        like_count: likeCountMap.get(m.id) ?? 0,
        user_has_liked: userLikedSet.has(m.id),
      })));
      setLoading(false);
    })();
  }, [opponent, matchDate, competition]);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const avgs = reviews.length ? {
    atmosphere: avg(reviews.map(r => r.atmosphere)),
    view: avg(reviews.map(r => r.view_rating)),
    scran: avg(reviews.map(r => r.scran)),
    damage: avg(reviews.map(r => r.damage)),
  } : null;

  const overall = avgs ? (avgs.atmosphere + avgs.view + avgs.scran + avgs.damage) / 4 : 0;

  const motmLeaderboard = Object.entries(
    reviews.reduce((acc, r) => {
      if (!r.motm_player) return acc;
      acc[r.motm_player] = (acc[r.motm_player] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const isAway = reviews[0]?.is_away;

  return (
    <AppShell>
      <div className="space-y-6">
        <button
          onClick={() => nav("/matches")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Matches
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider ${isAway ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
                  {isAway ? "Away" : "Home"}
                </span>
                <span className="text-xs text-muted-foreground">{competition}</span>
              </div>
              <h1 className="font-display text-4xl tracking-wider leading-none">vs {opponent}</h1>
              <p className="text-sm text-muted-foreground">
                {matchDate ? format(parseISO(matchDate), "d MMMM yyyy") : ""}
              </p>
            </div>

            {/* Overall grade */}
            {avgs && (
              <div className="stat-card flex items-center gap-5">
                <LetterGrade value={overall} size="lg" />
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Overall Grade</p>
                  <p className="font-display text-5xl tracking-wider leading-none">{overall.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
                </div>
              </div>
            )}

            {/* Avg stats */}
            {avgs && (
              <div className="grid grid-cols-4 gap-2">
                <Mini label={isAway ? "Atmos" : "Home Atmos"} v={avgs.atmosphere} />
                <Mini label={isAway ? "View" : "Away Fans"} v={avgs.view} />
                <Mini label={isAway ? "Scran" : "Team"} v={avgs.scran} />
                <Mini label={isAway ? "Team" : "Logistics"} v={avgs.damage} />
              </div>
            )}

            {/* MOTM leaderboard */}
            {motmLeaderboard.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-2xl tracking-wider">Man of the Match</h2>
                <div className="rounded-2xl overflow-hidden border border-border bg-card">
                  <div className="grid grid-cols-[2rem_1fr_3rem] gap-3 px-4 py-3 bg-secondary/60 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    <span>#</span>
                    <span>Player</span>
                    <span className="text-right">Votes</span>
                  </div>
                  {motmLeaderboard.map(([player, count], i) => (
                    <div key={player} className="grid grid-cols-[2rem_1fr_3rem] gap-3 px-4 py-3 items-center border-t border-border/60">
                      <span className={`font-display text-xl tracking-wider ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {i === 0 && <Star className="h-4 w-4 text-primary shrink-0" />}
                        <span className="font-extrabold truncate">{player}</span>
                      </div>
                      <span className="text-right font-display text-xl tracking-wider text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl tracking-wider">Reviews</h2>
              {reviews.map(r => (
                <ReviewCard
                  key={r.id}
                  data={r}
                  onDeleted={(id) => setReviews(rs => rs.filter(x => x.id !== id))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

const Mini = ({ label, v }: { label: string; v: number }) => (
  <div className="stat-card !p-3 flex flex-col items-center">
    <span className="font-display text-2xl tracking-wider leading-none">{v.toFixed(1)}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
  </div>
);

export default MatchDetail;