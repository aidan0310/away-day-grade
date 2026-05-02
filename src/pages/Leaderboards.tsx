import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PREMIER_LEAGUE_CLUBS,
  clubForName,
  hexToHslString,
  readableForegroundHsl,
  normalizeClubName,
} from "@/lib/premier-league";
import { Avatar } from "@/components/Avatar";

type TabKey = "atmosphere" | "scran" | "view" | "price" | "away_support" | "most_active";

const TABS: { key: TabKey; label: string; sub: string }[] = [
  { key: "atmosphere", label: "Atmosphere", sub: "Away fan scores" },
  { key: "scran", label: "Scran", sub: "Food & drink" },
  { key: "view", label: "The View", sub: "Stadium sightlines" },
  { key: "price", label: "Price/Value", sub: "Lowest avg pint £" },
  { key: "away_support", label: "Away Support", sub: "Home fan scores of visitors" },
  { key: "most_active", label: "Most Active", sub: "Most matches logged" },
];

type Match = {
  stadium_id: string;
  is_away: boolean;
  opponent: string;
  atmosphere: number;
  view_rating: number;
  scran: number;
  damage: number;
  pint_price: number | null;
};

type Stadium = { id: string; name: string };

type Row = {
  club: string;
  stadiumId: string | null;
  score: number;
  count: number;
};

const Leaderboards = () => {
  const nav = useNavigate();
  const { profile } = useAuth();
  const userClub = normalizeClubName(profile?.supported_team ?? "");
  const userClubMeta = clubForName(userClub);

  const [tab, setTab] = useState<TabKey>("atmosphere");
  const [matches, setMatches] = useState<Match[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState<{ id: string; display_name: string; supported_team: string | null; avatar_url: string | null; match_count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: s }] = await Promise.all([
        supabase.from("matches").select("stadium_id, is_away, opponent, atmosphere, view_rating, scran, damage, pint_price"),
        supabase.from("stadiums").select("id, name"),
      ]);
      setMatches((m ?? []) as Match[]);
      setStadiums((s ?? []) as Stadium[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: allMatches } = await supabase.from("matches").select("user_id");
      if (!allMatches) return;
      const countMap = new Map<string, number>();
      allMatches.forEach((m: any) => {
        countMap.set(m.user_id, (countMap.get(m.user_id) ?? 0) + 1);
      });
      const userIds = [...countMap.keys()];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, supported_team, avatar_url")
        .in("id", userIds);
      const ranked = (profiles ?? []).map((p: any) => ({
        ...p,
        match_count: countMap.get(p.id) ?? 0,
      })).sort((a: any, b: any) => b.match_count - a.match_count);
      setActiveUsers(ranked);
    })();
  }, []);

  const rows: Row[] = useMemo(() => {
    const stadiumIdToClub = new Map<string, string>();
    const clubToStadiumId = new Map<string, string>();
    stadiums.forEach((s) => {
      const club = PREMIER_LEAGUE_CLUBS.find((c) => c.stadium === s.name);
      if (club) {
        stadiumIdToClub.set(s.id, club.name);
        clubToStadiumId.set(club.name, s.id);
      }
    });

    const sums = new Map<string, { sum: number; n: number }>();
    matches.forEach((mt) => {
      const stadiumClub = stadiumIdToClub.get(mt.stadium_id);
      let club: string | undefined = stadiumClub;
      let value: number | null = null;

      switch (tab) {
        case "atmosphere":
          if (mt.is_away) value = mt.atmosphere;
          break;
        case "scran":
          if (mt.is_away) value = mt.scran;
          break;
        case "view":
          if (mt.is_away) value = mt.view_rating;
          break;
        case "price":
          if (mt.is_away && mt.pint_price != null) value = Number(mt.pint_price);
          break;
        case "away_support":
          if (!mt.is_away) {
            value = mt.view_rating;
            const normalizedOpp = normalizeClubName(mt.opponent ?? "");
            club = PREMIER_LEAGUE_CLUBS.find((c) => c.name === normalizedOpp)?.name;
          }
          break;
      }
      if (value == null || !club) return;
      const cur = sums.get(club) ?? { sum: 0, n: 0 };
      cur.sum += value;
      cur.n += 1;
      sums.set(club, cur);
    });

    const all: Row[] = PREMIER_LEAGUE_CLUBS.map((c) => {
      const stat = sums.get(c.name);
      return {
        club: c.name,
        stadiumId: clubToStadiumId.get(c.name) ?? null,
        score: stat ? stat.sum / stat.n : 0,
        count: stat?.n ?? 0,
      };
    });

    const ranked = all.filter((r) => r.count > 0);
    if (tab === "price") {
      ranked.sort((a, b) => a.score - b.score);
    } else {
      ranked.sort((a, b) => b.score - a.score);
    }
    return ranked;
  }, [matches, stadiums, tab]);

  const isPrice = tab === "price";

  return (
    <AppShell title="Leaderboards">
      <div className="space-y-5">
        <div className="-mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1 pb-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all",
                  tab === t.key
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "bg-card text-muted-foreground border border-border"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground -mt-2">
          {TABS.find((t) => t.key === tab)?.sub}
          {isPrice ? " — lower is better." : tab === "most_active" ? "." : " — out of 10."}
        </p>

        {tab === "most_active" ? (
          activeUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No data yet.</p>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              <div className="grid grid-cols-[3rem_1fr_5rem] gap-3 px-4 py-3 bg-secondary/60 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                <span>#</span>
                <span>Fan</span>
                <span className="text-right">Matches</span>
              </div>
              {activeUsers.map((u, i) => {
                const isUser = u.id === profile?.id;
                return (
                  <div
                    key={u.id}
                    className={cn(
                      "grid grid-cols-[3rem_1fr_5rem] gap-3 px-4 py-3 items-center border-t border-border/60",
                      isUser && "bg-primary/10"
                    )}
                  >
                    <span className={cn("font-display text-2xl tracking-wider", i < 3 ? "text-primary" : "text-muted-foreground")}>
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar url={u.avatar_url} name={u.display_name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-extrabold truncate text-sm">@{u.display_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.supported_team ?? ""}</p>
                      </div>
                    </div>
                    <span className="text-right font-display text-2xl tracking-wider text-primary">{u.match_count}</span>
                  </div>
                );
              })}
            </div>
          )
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            No data yet for this category.
          </p>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            <div className="grid grid-cols-[3rem_1fr_5rem] gap-3 px-4 py-3 bg-secondary/60 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              <span>#</span>
              <span>Club</span>
              <span className="text-right">{isPrice ? "Avg £" : "Score"}</span>
            </div>
            {rows.map((r, i) => {
              const isUser = r.club === userClub;
              const userBgHsl = isUser && userClubMeta ? hexToHslString(userClubMeta.primaryHex) : null;
              const userFgHsl = isUser && userClubMeta ? readableForegroundHsl(userClubMeta.primaryHex) : null;
              const scoreColor = isPrice ? "" : r.score >= 8 ? "text-rating-good" : r.score < 4 ? "text-rating-bad" : "text-foreground";

              return (
                <button
                  key={r.club}
                  onClick={() => r.stadiumId && nav(`/stadium/${r.stadiumId}`)}
                  disabled={!r.stadiumId}
                  className={cn(
                    "w-full grid grid-cols-[3rem_1fr_5rem] gap-3 px-4 py-3 items-center text-left border-t border-border/60 transition-colors",
                    !isUser && "hover:bg-secondary/40",
                    !r.stadiumId && "opacity-70 cursor-default"
                  )}
                  style={isUser ? { background: `hsl(${userBgHsl})`, color: `hsl(${userFgHsl})` } : undefined}
                >
                  <span className={cn("font-display text-2xl tracking-wider", !isUser && (i < 3 ? "text-primary" : "text-muted-foreground"))}>
                    {i + 1}
                  </span>
                  <span className="font-extrabold truncate">{r.club}</span>
                  <span className={cn("text-right font-display text-2xl tracking-wider", !isUser && scoreColor)}>
                    {isPrice ? `£${r.score.toFixed(2)}` : r.score.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Leaderboards;