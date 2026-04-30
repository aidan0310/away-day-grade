import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { GradePill } from "@/components/GradePill";
import { Loader2, ChevronRight, MapPin } from "lucide-react";

type Row = {
  id: string;
  name: string;
  count: number;
  avg: number;
};

const Stadiums = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: stadiums } = await supabase.from("stadiums").select("id, name");
      const { data: matches } = await supabase.from("matches").select("stadium_id, atmosphere, view_rating, scran, damage").eq("is_away", true);
      const map = new Map<string, { sum: number; n: number }>();
      (matches ?? []).forEach((m: any) => {
        const avg = (m.atmosphere + m.view_rating + m.scran + m.damage) / 4;
        const cur = map.get(m.stadium_id) ?? { sum: 0, n: 0 };
        cur.sum += avg; cur.n += 1;
        map.set(m.stadium_id, cur);
      });
      const r: Row[] = (stadiums ?? []).map((s) => {
        const stat = map.get(s.id);
        return {
          id: s.id,
          name: s.name,
          count: stat?.n ?? 0,
          avg: stat ? stat.sum / stat.n : 0,
        };
      }).filter(r => r.count > 0)
        .sort((a, b) => b.avg - a.avg);
      setRows(r);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell title="Stadiums">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground -mt-1">Ranked by average Away Day Grade.</p>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No stadiums logged yet.</p>
        ) : (
          rows.map((r, i) => (
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
