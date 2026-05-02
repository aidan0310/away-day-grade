import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Loader2, ArrowLeft } from "lucide-react";
import { getRank } from "@/lib/ranks";
import { Avatar } from "@/components/Avatar";

type Follower = {
  id: string;
  display_name: string;
  supported_team: string | null;
  match_count: number;
  avatar_url: string | null;
};

const Following = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (!follows || follows.length === 0) {
        setLoading(false);
        return;
      }

      const ids = follows.map((f: any) => f.following_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, supported_team, avatar_url")
        .in("id", ids);

      const { data: matches } = await supabase
        .from("matches")
        .select("user_id")
        .in("user_id", ids);

      const countMap = new Map<string, number>();
      (matches ?? []).forEach((m: any) => {
        countMap.set(m.user_id, (countMap.get(m.user_id) ?? 0) + 1);
      });

      setFollowing((profiles ?? []).map((p: any) => ({
        ...p,
        match_count: countMap.get(p.id) ?? 0,
      })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppShell title="Following">
      <div className="space-y-5">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Profile
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-muted-foreground">You're not following anyone yet.</p>
            <button
              onClick={() => nav("/search")}
              className="text-primary font-extrabold text-sm underline"
            >
              Find fans to follow
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            {following.map((f) => {
              const rank = getRank(f.match_count);
              return (
                <button
                  key={f.id}
                  onClick={() => nav(`/user/${f.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-secondary/40 transition-colors border-t border-border/60 first:border-0"
                >
                  <Avatar url={r.avatar_url} name={r.display_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold truncate">@{f.display_name}</p>
                    <p className="text-xs text-muted-foreground">{f.supported_team ?? "No team"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-extrabold uppercase tracking-wider ${rank.color}`}>{rank.label}</p>
                    <p className="text-xs text-muted-foreground">{f.match_count} {f.match_count === 1 ? "match" : "matches"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Following;