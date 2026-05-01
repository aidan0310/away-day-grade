import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIER_LEAGUE_CLUBS, normalizeClubName, stadiumForClub } from "@/lib/premier-league";
import { MotmCombobox } from "@/components/MotmCombobox";

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
});

const LogMatch = () => {
  const nav = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = Boolean(editId);
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
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [motmPlayer, setMotmPlayer] = useState("");
  const [motmComment, setMotmComment] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({
    atmosphere: 7, view_rating: 7, scran: 5, damage: 5,
  });
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);

  // MOTM is ALWAYS picked from the user's own supported club, regardless of
  // home or away. (Fans pick their own player, not the opposition's.)
  const ratedClub = normalizedSupportedTeam;

  // Load existing match for edit
  useEffect(() => {
    if (!isEdit || !user || !editId) return;
    (async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", editId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Could not load match");
        nav("/profile");
        return;
      }
      if (data.user_id !== user.id) {
        toast.error("You can only edit your own reviews");
        nav("/profile");
        return;
      }
      setIsAway(data.is_away);
      setOpponent(data.opponent);
      setDate(data.match_date);
      setNote(data.note ?? "");
      setPintPrice(data.pint_price != null ? String(data.pint_price) : "");
      setHomeScore(data.home_score != null ? String(data.home_score) : "");
      setAwayScore(data.away_score != null ? String(data.away_score) : "");
      setMotmPlayer(data.motm_player ?? "");
      setMotmComment(data.motm_comment ?? "");
      setRatings({
        atmosphere: data.atmosphere,
        view_rating: data.view_rating,
        scran: data.scran,
        damage: data.damage,
      });
      setLoadingExisting(false);
    })();
  }, [isEdit, editId, user, nav]);

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
    const parsed = schema.safeParse({ opponent, stadium, match_date: date, note });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!motmPlayer.trim()) {
      toast.error(`Pick your ${supportedTeam || "team's"} Man of the Match.`);
      return;
    }
    setSaving(true);
    try {
      // upsert stadium by name (and tag the home team if known)
      const { data: existing } = await supabase.from("stadiums").select("id").eq("name", stadium.trim()).maybeSingle();
      let stadiumId = existing?.id;
      if (!stadiumId) {
        const homeTeam = isAway ? opponent : normalizedSupportedTeam;
        const { data: created, error: cErr } = await supabase
          .from("stadiums")
          .insert({ name: stadium.trim(), team: homeTeam || null })
          .select("id")
          .single();
        if (cErr) throw cErr;
        stadiumId = created.id;
      }

      const payload = {
        stadium_id: stadiumId,
        opponent: opponent.trim(),
        match_date: date,
        is_away: isAway,
        atmosphere: ratings.atmosphere,
        view_rating: ratings.view_rating,
        scran: ratings.scran,
        damage: ratings.damage,
        pint_price: pintPrice ? Number(parseFloat(pintPrice).toFixed(2)) : null,
        home_score: homeScore !== "" ? parseInt(homeScore) : null,
        away_score: awayScore !== "" ? parseInt(awayScore) : null,
        motm_player: motmPlayer.trim(),
        motm_comment: motmComment.trim() || null,
        note: note.trim() || null,
      };

      if (isEdit && editId) {
        const { error } = await supabase
          .from("matches")
          .update(payload)
          .eq("id", editId)
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("Review updated.");
      } else {
        const { error } = await supabase.from("matches").insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("Match logged. Up the lads.");
      }
      nav(isEdit ? "/profile" : "/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <AppShell title="Edit Match">
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell title={isEdit ? "Edit Match" : "Log Match"}>
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

        <Field label="Match Result (optional)">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              placeholder="0"
              className="h-12 bg-secondary border-0 text-center font-extrabold text-lg"
            />
            <span className="font-display text-2xl tracking-wider text-muted-foreground">-</span>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              placeholder="0"
              className="h-12 bg-secondary border-0 text-center font-extrabold text-lg"
            />
          </div>
          <p className="text-xs text-muted-foreground">Home score on the left, away on the right.</p>
        </Field>

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

        <Field label={`Your Man of the Match${ratedClub ? ` (${ratedClub})` : ""}`}>
          <p className="text-xs text-muted-foreground -mt-1">Pick the standout player from your side.</p>
          <MotmCombobox club={ratedClub} value={motmPlayer} onChange={setMotmPlayer} />
          <Textarea
            value={motmComment}
            onChange={(e) => setMotmComment(e.target.value.slice(0, 280))}
            placeholder="Why? (optional)"
            className="bg-card border-border min-h-[64px]"
          />
        </Field>

        <Field label="Notes (optional)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="Best pie I've had in years..." className="bg-card border-border min-h-[88px]" />
        </Field>

        <Button onClick={submit} disabled={saving} className="w-full h-14 text-base font-extrabold bg-gradient-primary text-primary-foreground shadow-glow">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : (isEdit ? "Update Review" : "Submit Scorecard")}
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

export default LogMatch;
