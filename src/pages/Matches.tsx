import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Loader2, Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

type MatchGroup = {
  opponent: string;
  match_date: string;
  competition: string;
  stadium_name: string;
  is_away: boolean;
  review_count: number;
  avg_grade: number;
  key: string;
};

type SortKey = "date" | "reviews";

const Matches = () => {
  const nav = useNavigate();
  const [matches, setMatches] = useState<MatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("date");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("matches")
        .select("opponent, match_date, competition, is_away, atmosphere, view_rating, scran, damage, stadium:stadiums(id, name)");

      if (!data) { setLoading(false); return; }

      // Group by opponent + date + competition
      const groupMap = new Map<string, MatchGroup>();
      data.forEach((m: any) => {
        const key = `${m.opponent}__${m.match_date}__${m.competition ?? "Premier League"}`;
        const avg = (m.atmosphere + m.view_rating + m.scran + m.damage) / 4;
        if (groupMap.has(key)) {
          const g = groupMap.get(key)!;
          g.review_count += 1;
          g.avg_grade = (g.avg_grade * (g.review_count - 1) + avg) / g.review_count;
        } else {
          groupMap.set(key, {
            opponent: m.opponent,
            match_date: m.match_date,
            competition: m.competition ?? "Premier League",
            stadium_name: m.stadium?.name ?? "",
            is_away: m.is_away,
            review_count: 1,
            avg_grade: avg,
            key,
          });
        }
      });

      setMatches([...groupMap.values()]);
      setLoading(false);
    })();
  }, []);

  const sorted = [...matches].sort((a, b) => {
    if (sort === "date") return b.match_date.localeCompare(a.match_date);
    return b.review_count - a.review_count;
  });

  return (
    <AppShell title="Matches">
      <div className="space-y-4">
        {/* Sort toggle */}
        <div className="flex gap-2">
          {([
            { key: "date", label: "Most Recent" },
            { key: "reviews", label: "Most Reviewed" },
          ] as { key: SortKey; label: string }[]).map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all",
                sort === s.key
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No matches logged yet.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((m) => (
              <button
                key={m.key}
                onClick={() => nav(`/match/${encodeURIComponent(m.key)}`)}
                className="w-full stat-card flex items-center gap-4 text-left hover:border-primary/50 transition-all"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider ${m.is_away ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
                      {m.is_away ? "Away" : "Home"}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.competition}</span>
                  </div>
                  <p className="font-extrabold text-lg leading-tight truncate">vs {m.opponent}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(m.match_date), "d MMM yyyy")}
                    </span>
                    <span>{m.review_count} {m.review_count === 1 ? "review" : "reviews"}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-3xl tracking-wider text-primary">{m.avg_grade.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">avg grade</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Matches;