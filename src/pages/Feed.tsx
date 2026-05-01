import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ReviewCard, ReviewCardData } from "@/components/ReviewCard";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedTab = "all" | "following";

const Feed = () => {
  const { profile, user } = useAuth();
  const nav = useNavigate();
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [tab, setTab] = useState<FeedTab>("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // Fetch who the user follows
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      setFollowingIds((data ?? []).map((f: any) => f.following_id));
    })();
  }, [user]);

  // Fetch all reviews
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: matches } = await supabase
        .from("matches")
        .select("*, stadium:stadiums(id,name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!matches) { setLoading(false); return; }

      const userIds = [...new Set(matches.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, supported_team")
        .in("id", userIds);

      // Get match counts for ranks
      const { data: matchCounts } = await supabase
        .from("matches")
        .select("user_id")
        .in("user_id", userIds);

      const countMap = new Map<string, number>();
      (matchCounts ?? []).forEach((m: any) => {
        countMap.set(m.user_id, (countMap.get(m.user_id) ?? 0) + 1);
      });

      const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

      setReviews(matches.map((m: any) => ({
        ...m,
        profile: pmap.get(m.user_id)
          ? { ...pmap.get(m.user_id), match_count: countMap.get(m.user_id) ?? 0 }
          : null,
      })));
      setLoading(false);
    })();
  }, [lastRefresh]);

  const displayed = tab === "following"
    ? reviews.filter(r => followingIds.includes(r.user_id))
    : reviews;

  return (
    <AppShell
      title="Terrace"
      right={
        <button
          onClick={() => nav("/search")}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-primary transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
          <p className="text-xs font-extrabold uppercase tracking-widest opacity-80">Welcome back</p>
          <p className="text-2xl font-extrabold mt-1">{profile?.supported_team ? `Up the ${profile.supported_team}` : "Pick your team"}</p>
          <p className="text-sm opacity-90 mt-1">Latest reviews from the away end.</p>
          <button
            onClick={() => { setLastRefresh(Date.now()); }}
            className="mt-2 text-xs font-extrabold uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["all", "following"] as FeedTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all",
                tab === t
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              {t === "all" ? "All" : "Following"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayed.length === 0 && tab === "following" ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">No reviews from people you follow yet.</p>
            <button
              onClick={() => nav("/search")}
              className="text-primary font-extrabold text-sm underline"
            >
              Find fans to follow
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">No reviews on the feed yet.</p>
            <Link to="/log">
              <Button className="bg-gradient-primary text-primary-foreground font-extrabold">
                <Plus className="h-4 w-4 mr-2" /> Log the first match
              </Button>
            </Link>
          </div>
        ) : (
          displayed.map((r) => (
            <ReviewCard
              key={r.id}
              data={r}
              onDeleted={(id) => setReviews(rs => rs.filter(x => x.id !== id))}
            />
          ))
        )}
      </div>
    </AppShell>
  );
};

export default Feed;