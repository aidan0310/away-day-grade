import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ReviewCard, ReviewCardData } from "@/components/ReviewCard";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Feed = () => {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("*, stadium:stadiums(id,name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!matches) { setLoading(false); return; }

      const userIds = [...new Set(matches.map(m => m.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, supported_team").in("id", userIds);
      const pmap = new Map((profiles ?? []).map(p => [p.id, p]));

      setReviews(matches.map((m: any) => ({
        ...m,
        profile: pmap.get(m.user_id) ?? null,
      })));
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell title="Terrace">
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
          <p className="text-xs font-extrabold uppercase tracking-widest opacity-80">Welcome back</p>
          <p className="text-2xl font-extrabold mt-1">{profile?.supported_team ? `Up the ${profile.supported_team}` : "Pick your team"}</p>
          <p className="text-sm opacity-90 mt-1">Latest reviews from the away end.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">No reviews on the feed yet.</p>
            <Link to="/log">
              <Button className="bg-gradient-primary text-primary-foreground font-extrabold">
                <Plus className="h-4 w-4 mr-2" /> Log the first match
              </Button>
            </Link>
          </div>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} data={r} />)
        )}
      </div>
    </AppShell>
  );
};

export default Feed;
