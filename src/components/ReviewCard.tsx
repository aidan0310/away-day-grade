import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Trophy, Trash2, Pencil, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { GradePill } from "./GradePill";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReviewCardData = {
  id: string;
  user_id?: string;
  opponent: string;
  match_date: string;
  is_away: boolean;
  atmosphere: number;
  view_rating: number;
  scran: number;
  damage: number;
  pint_price: number | null;
  note: string | null;
  motm_player?: string | null;
  motm_comment?: string | null;
  stadium: { id: string; name: string };
  profile: { display_name: string; supported_team: string | null } | null;
};

const avg = (m: ReviewCardData) =>
  (m.atmosphere + m.view_rating + m.scran + m.damage) / 4;

export const ReviewCard = ({
  data,
  onDeleted,
}: {
  data: ReviewCardData;
  /** Optional callback fired after a successful delete so the parent can refresh stats/lists. */
  onDeleted?: (id: string) => void;
}) => {
  const grade = avg(data);
  const { user } = useAuth();
  const nav = useNavigate();
  const isOwner = !!user && !!data.user_id && user.id === data.user_id;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isOwner) return;
    setDeleting(true);
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", data.id)
      .eq("user_id", user!.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message || "Couldn't delete review.");
      return;
    }
    toast.success("Review removed from your Passport.");
    setConfirmOpen(false);
    onDeleted?.(data.id);
  };

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
        <Stat label={data.is_away ? "Atmos" : "Home Atmos"} value={data.atmosphere} />
        <Stat label={data.is_away ? "View" : "Away Fans"} value={data.view_rating} />
        <Stat label={data.is_away ? "Scran" : "Team"} value={data.scran} />
        <Stat label={data.is_away ? "Damage" : "Logistics"} value={data.damage} />
      </div>

      {data.pint_price != null && (
        <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 border border-border/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pint Price</span>
          <span className="font-display text-xl tracking-wider text-primary">£{Number(data.pint_price).toFixed(2)}</span>
        </div>
      )}

      {data.motm_player && (
        <div className="rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Fans' MOTM</span>
            <span className="font-extrabold text-sm truncate">{data.motm_player}</span>
          </div>
          {data.motm_comment && (
            <p className="text-xs text-foreground/75 italic pl-6">"{data.motm_comment}"</p>
          )}
        </div>
      )}

      {data.note && (
        <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary pl-3">
          "{data.note}"
        </p>
      )}

      <footer className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
        <span className="font-semibold text-foreground/70 truncate">@{data.profile?.display_name ?? "fan"}</span>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 mr-1">
            <Calendar className="h-3 w-3" />
            {format(parseISO(data.match_date), "d MMM yyyy")}
          </span>
          {isOwner && (
            <>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Edit review"
                onClick={() => nav(`/log/${data.id}`)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Delete review"
                onClick={() => setConfirmOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </footer>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this match from your Passport and stats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center justify-center rounded-xl bg-secondary/60 py-2">
    <span className="text-lg font-extrabold leading-none">{value}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
  </div>
);
