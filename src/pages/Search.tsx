import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Loader2, Search as SearchIcon, User } from "lucide-react";
import { getRank } from "@/lib/ranks";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/Avatar";

type Result = {
  id: string;
  display_name: string;
  supported_team: string | null;
  match_count: number;
  avatar_url: string | null;
};

const Search = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, supported_team")
      .ilike("display_name", `%${val.trim()}%`)
      .neq("id", user?.id ?? "")
      .limit(20);

    if (!profiles) { setLoading(false); setSearched(true); return; }

    // Get match counts for each user
    const ids = profiles.map(p => p.id);
    const { data: matches } = await supabase
      .from("matches")
      .select("user_id")
      .in("user_id", ids);

    const countMap = new Map<string, number>();
    (matches ?? []).forEach((m: any) => {
      countMap.set(m.user_id, (countMap.get(m.user_id) ?? 0) + 1);
    });

    setResults(profiles.map(p => ({
      ...p,
      match_count: countMap.get(p.id) ?? 0,
    })));
    setLoading(false);
    setSearched(true);
  };

  return (
    <AppShell title="Search">
      <div className="space-y-5">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search by display name..."
            className="h-12 bg-card border-border pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length === 0 && searched ? (
          <p className="text-center text-muted-foreground py-16">No users found for "{query}".</p>
        ) : results.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Type a name to find other fans.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            {results.map((r, i) => {
              const rank = getRank(r.match_count);
              return (
                <button
                  key={r.id}
                  onClick={() => nav(`/user/${r.id}`)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-secondary/40 transition-colors border-t border-border/60 first:border-0"
                >
                  <Avatar url={r.avatar_url} name={r.display_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold truncate">@{r.display_name}</p>
                    <p className="text-xs text-muted-foreground">{r.supported_team ?? "No team"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-extrabold uppercase tracking-wider ${rank.color}`}>{rank.label}</p>
                    <p className="text-xs text-muted-foreground">{r.match_count} {r.match_count === 1 ? "match" : "matches"}</p>
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

export default Search;