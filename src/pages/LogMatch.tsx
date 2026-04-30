import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, MapPin, Trophy, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIER_LEAGUE_CLUBS, normalizeClubName, stadiumForClub } from "@/lib/premier-league";
import { squadFor } from "@/lib/squads";

// Same 4 DB columns (atmosphere, view_rating, scran, damage) reused with
// different meanings depending on whether the user attended as a Home or Away fan.
const AWAY_RATINGS = [
  { key: "atmosphere", label: "Atmosphere", desc: "Home (opposition) fans' noise & buzz" },
  { key: "view_rating", label: "The View", desc: "Pitch visibility from away end" },
  { key: "scran", label: "Scran & Pints", desc: "Food & drink quality" },
  { key: "damage", label: "The Damage", desc: "Value for money (1–10)" },
] as const;

const HOME_RATINGS = [
  { key: "atmosphere", label: "Home Atmosphere", desc: "Your end's noise & songs" },
  { key: "view_rating", label: "Opposition Fan Noise", desc: "How loud were the away lot?" },
  { key: "scran", label: "Team Performance", desc: "How did your side play?" },
  { key: "damage", label: "Stadium Logistics", desc: "Ease of entry, queues, getting out" },
] as const;

const schema = z.object({
  opponent: z.string().trim().min(2).max(80),
  stadium: z.string().trim().min(2).max(120),
  match_date: z.string().min(1),
  note: z.string().max(500).optional(),
  motm_player: z.string().trim().min(1, "Pick a Man of the Match"),
  motm_comment: z.string().max(140).optional(),
});

const LogMatch = () => {
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [isAway, setIsAway] = useState(true);
  const [opponent, setOpponent] = useState("");
  const supportedTeam = profile?.supported_team ?? "";
  const normalizedSupportedTeam = normalizeClubName(supportedTeam);

  // Stadium is determined by venue: home = supporter's club, away = opponent's club.
  const stadium = useMemo(() => {
    const club = isAway ? opponent : normalizedSupportedTeam;
    return stadiumForClub(club) ?? "";
  }, [isAway, opponent, normalizedSupportedTeam]);

  const opponentOptions = useMemo(
    () => PREMIER_LEAGUE_CLUBS.filter((c) => c.name !== normalizedSupportedTeam),
    [normalizedSupportedTeam]
  );
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [pintPrice, setPintPrice] = useState<string>("");
  const [ratings, setRatings] = useState<Record<string, number>>({
    atmosphere: 7, view_rating: 7, scran: 5, damage: 5,
  });
  const [motmPlayer, setMotmPlayer] = useState("");
  const [motmComment, setMotmComment] = useState("");
  const [saving, setSaving] = useState(false);

  // The MOTM is voted from the user's own team (the home club if a home match,
  // the user's supported club if they travelled away).
  const motmClub = isAway ? normalizedSupportedTeam : normalizedSupportedTeam;
  const motmSquad = useMemo(() => squadFor(motmClub), [motmClub]);

  const submit = async () => {
    if (!user) return;
    if (!stadium) {
      toast.error(
        isAway
          ? "Pick an opponent to set the stadium."
          : "Set your Premier League club in your profile first."
      );
      return;
    }
    const parsed = schema.safeParse({
      opponent, stadium, match_date: date, note,
      motm_player: motmPlayer, motm_comment: motmComment,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      // upsert stadium by name
      const { data: existing } = await supabase.from("stadiums").select("id").eq("name", stadium.trim()).maybeSingle();
      let stadiumId = existing?.id;
      if (!stadiumId) {
        const { data: created, error: cErr } = await supabase.from("stadiums").insert({ name: stadium.trim() }).select("id").single();
        if (cErr) throw cErr;
        stadiumId = created.id;
      }

      const { error } = await supabase.from("matches").insert({
        user_id: user.id,
        stadium_id: stadiumId,
        opponent: opponent.trim(),
        match_date: date,
        is_away: isAway,
        atmosphere: ratings.atmosphere,
        view_rating: ratings.view_rating,
        scran: ratings.scran,
        damage: ratings.damage,
        pint_price: pintPrice ? Number(parseFloat(pintPrice).toFixed(2)) : null,
        note: note.trim() || null,
        motm_player: motmPlayer.trim(),
        motm_comment: motmComment.trim() || null,
      });
      if (error) throw error;
      toast.success("Match logged. Up the lads.");
      nav("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Log Match">
      <div className="space-y-6">
        {/* Home / Away toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-1.5 border border-border">
          {[
            { v: false, l: "Home" },
            { v: true, l: "Away" },
          ].map((o) => (
            <button
              key={o.l}
              onClick={() => setIsAway(o.v)}
              className={cn(
                "rounded-xl py-3 text-sm font-extrabold uppercase tracking-wider transition-all",
                isAway === o.v
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground"
              )}
            >
              {o.l}
            </button>
          ))}
        </div>

        <div className="space-y-4 stat-card">
          <Field label="Opponent">
            <Select value={opponent} onValueChange={setOpponent}>
              <SelectTrigger className="h-12 bg-secondary border-0">
                <SelectValue placeholder="Pick a Premier League club" />
              </SelectTrigger>
              <SelectContent className="max-h-72 bg-card">
                {opponentOptions.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Stadium">
            <div className="h-12 flex items-center gap-2 rounded-md bg-secondary/60 px-3 border border-dashed border-border">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className={cn("text-sm font-bold truncate", stadium ? "text-foreground" : "text-muted-foreground")}>
                {stadium ||
                  (isAway
                    ? "Pick an opponent to set stadium"
                    : supportedTeam
                      ? "Your saved club is not a Premier League club"
                      : "Set your club in profile to auto-fill")}
              </span>
            </div>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 bg-secondary border-0" />
          </Field>
        </div>

        {/* Scorecard */}
        <div className="space-y-1">
          <h2 className="font-display text-2xl tracking-wider">Scorecard</h2>
          <p className="text-sm text-muted-foreground">Rate 1–10. Be honest, be brutal.</p>
        </div>

        <div className="space-y-3">
          {(isAway ? AWAY_RATINGS : HOME_RATINGS).map((r) => (
            <RatingRow
              key={r.key}
              label={r.label}
              desc={r.desc}
              value={ratings[r.key]}
              onChange={(v) => setRatings((s) => ({ ...s, [r.key]: v }))}
            />
          ))}
        </div>

        <Field label="Price of a pint (optional)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-lg text-muted-foreground pointer-events-none">£</span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.10"
              value={pintPrice}
              onChange={(e) => setPintPrice(e.target.value)}
              placeholder="6.50"
              className="h-12 bg-secondary border-0 pl-9 font-extrabold text-lg"
            />
          </div>
          <p className="text-xs text-muted-foreground">Helps fans see the average pint price at this ground.</p>
        </Field>

        {/* Man of the Match */}
        <MotmPicker
          club={motmClub}
          squad={motmSquad}
          player={motmPlayer}
          comment={motmComment}
          onPlayer={setMotmPlayer}
          onComment={setMotmComment}
        />

        <Field label="Notes (optional)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="Best pie I've had in years..." className="bg-card border-border min-h-[88px]" />
        </Field>

        <Button onClick={submit} disabled={saving} className="w-full h-14 text-base font-extrabold bg-gradient-primary text-primary-foreground shadow-glow">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Scorecard"}
        </Button>
      </div>
    </AppShell>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const RatingRow = ({ label, desc, value, onChange }: { label: string; desc: string; value: number; onChange: (v: number) => void }) => {
  const color = value >= 7.5 ? "text-rating-good" : value >= 5 ? "text-rating-mid" : "text-rating-bad";
  return (
    <div className="stat-card">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="font-extrabold text-lg leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <span className={cn("font-display text-4xl tracking-wider", color)}>{value}</span>
      </div>
      <Slider min={1} max={10} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
};


const MotmPicker = ({
  club, squad, player, comment, onPlayer, onComment,
}: {
  club: string;
  squad: string[];
  player: string;
  comment: string;
  onPlayer: (v: string) => void;
  onComment: (v: string) => void;
}) => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return squad;
    return squad.filter((p) => p.toLowerCase().includes(q));
  }, [query, squad]);

  return (
    <div className="stat-card space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-extrabold text-lg leading-tight">Man of the Match</p>
          <p className="text-xs text-muted-foreground">
            {club ? `Pick from the ${club} squad` : "Set your supported club to vote"}
          </p>
        </div>
      </div>

      {!squad.length ? (
        <p className="text-sm text-muted-foreground italic">
          No squad list available for this club yet.
        </p>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search squad..."
              className="h-11 bg-secondary border-0 pl-9"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {filtered.map((name) => {
              const active = player === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onPlayer(name)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-bold text-left transition-all border",
                    active
                      ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow"
                      : "bg-secondary/60 border-border hover:border-primary/40"
                  )}
                >
                  {active && <Trophy className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />}
                  {name}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full text-xs text-muted-foreground py-2">
                No players match "{query}".
              </p>
            )}
          </div>
        </>
      )}

      {player && (
        <div className="space-y-2 pt-1">
          <Label className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Your Shout (optional)
          </Label>
          <Input
            value={comment}
            onChange={(e) => onComment(e.target.value.slice(0, 140))}
            placeholder="Carried the midfield today..."
            className="h-11 bg-secondary border-0"
          />
        </div>
      )}
    </div>
  );
};

export default LogMatch;
