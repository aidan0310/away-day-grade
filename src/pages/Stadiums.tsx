import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { GradePill } from "@/components/GradePill";
import { Loader2, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAGUES, getLeagueForTeam } from "@/lib/clubs";

type Row = {
  id: string;
  name: string;
  team: string | null;
  count: number;
  avg: number;
};

const Stadiums = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>("All");

  useEffect(() => {
    (async () => {
      const { data: stadiums } = await supabase.from("stadiums").select("id, name, team");
      const { data: matches } = await supabase.from("matches").select("stadium_id, atmosphere, view_rating, scran, damage").eq("is_away", true);
      const map = new Map<string, { sum: number; n: number }>();
      (matches ?? []).forEach((m: any) => {
        const avg = (m.atmosphere + m.view_rating + m.scran + m.damage) / 4;
        const cur = map.get(m.stadium_id) ?? { sum: 0, n: 0 };
        cur.sum += avg; cur.n += 1;
        map.set(m.stadium_id, cur);
      });
      const r: Row[] = (stadiums ?? []).map((s: any) => {
        const stat = map.get(s.id);
        return {
          id: s.id,
          name: s.name,
          team: s.team ?? null,
          count: stat?.n ?? 0,
          avg: stat ? stat.sum / stat.n : 0,
        };
      }).filter(r => r.count > 0)
        .sort((a, b) => b.avg - a.avg);
      setRows(r);
      setLoading(false);
    })();
  }, []);

  const filtered = selectedLeague === "All"
    ? rows
    : rows.filter(r => r.team && getLeagueForTeam(r.team) === selectedLeague);

  return (
    <AppShell title="Stadiums">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground -mt-1">Ranked by average Away Day Grade.</p>

        {/* League filter */}
        <div className="-mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1 pb-1">
            {["All", ...LEAGUES].map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLeague(l)}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all",
                  selectedLeague === l
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "bg-card text-muted-foreground border border-border"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No stadiums logged for this league yet.</p>
        ) : (
          filtered.map((r, i) => (
            <Link key={r.id} to={`/stadium/${r.id}`} className="stat-card flex items-center gap-4 transition-all hover:border-primary/50">
              <span className="font-display text-2xl text-muted-foreground w-6 text-center">{i + 1}</span>
              <GradePill value={r.avg} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-extrabold truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {r.count} {r.count === 1 ? "review" : "reviews"}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
};

export default Stadiums;