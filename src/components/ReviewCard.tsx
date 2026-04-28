import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { GradePill } from "./GradePill";

export type ReviewCardData = {
  id: string;
  opponent: string;
  match_date: string;
  is_away: boolean;
  atmosphere: number;
  view_rating: number;
  scran: number;
  damage: number;
  pint_price: number | null;
  note: string | null;
  stadium: { id: string; name: string };
  profile: { display_name: string; supported_team: string | null } | null;
};

const avg = (m: ReviewCardData) =>
  (m.atmosphere + m.view_rating + m.scran + m.damage) / 4;

export const ReviewCard = ({ data }: { data: ReviewCardData }) => {
  const grade = avg(data);
  return (
    <article className="stat-card space-y-4 transition-all hover:border-primary/40 hover:shadow-elevated">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider ${data.is_away ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
              {data.is_away ? "Away" : "Home"}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {data.profile?.supported_team ?? "Fan"}
            </span>
          </div>
          <h3 className="text-xl font-extrabold leading-tight truncate">
            vs {data.opponent}
          </h3>
          <Link to={`/stadium/${data.stadium.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{data.stadium.name}</span>
          </Link>
        </div>
        <GradePill value={grade} size="md" />
      </header>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="Atmos" value={data.atmosphere} />
        <Stat label="View" value={data.view_rating} />
        <Stat label="Scran" value={data.scran} />
        <Stat label="Damage" value={data.damage} />
      </div>

      {data.pint_price != null && (
        <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 border border-border/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pint Price</span>
          <span className="font-display text-xl tracking-wider text-primary">£{Number(data.pint_price).toFixed(2)}</span>
        </div>
      )}

      {data.note && (
        <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary pl-3">
          "{data.note}"
        </p>
      )}

      <footer className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
        <span className="font-semibold text-foreground/70">@{data.profile?.display_name ?? "fan"}</span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(parseISO(data.match_date), "d MMM yyyy")}
        </span>
      </footer>
    </article>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/60 py-2">
    <span className="text-lg font-extrabold leading-none">{value}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
  </div>
);
