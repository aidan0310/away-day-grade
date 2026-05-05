import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Pencil, Trash2, Loader2, Star, Heart, Flag, Share2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { GradePill } from "./GradePill";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { ShareScorecard } from "./ShareScorecard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getRank } from "@/lib/ranks";
import { Avatar } from "@/components/Avatar";
import { PhotoViewer } from "./PhotoViewer";

export type ReviewCardData = {
  id: string;
  user_id: string;
  opponent: string;
  match_date: string;
  is_away: boolean;
  atmosphere: number;
  view_rating: number;
  scran: number;
  damage: number;
  pint_price: number | null;
  home_score: number | null;
  away_score: number | null;
  competition?: string | null;
  like_count?: number;
  user_has_liked?: boolean;
  motm_player?: string | null;
  motm_comment?: string | null;
  note: string | null;
  stadium: { id: string; name: string };
  profile: { display_name: string; supported_team: string | null; match_count?: number; avatar_url?: string | null } | null;
};

const avg = (m: ReviewCardData) =>
  (m.atmosphere + m.view_rating + m.scran + m.damage) / 4;

interface Props {
  data: ReviewCardData;
  onDeleted?: (id: string) => void;
}

export const ReviewCard = ({ data, onDeleted }: Props) => {
  const { user } = useAuth();
  const nav = useNavigate();
  const grade = avg(data);
  const isOwner = user?.id === data.user_id;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(data.user_has_liked ?? false);
  const [likeCount, setLikeCount] = useState(data.like_count ?? 0);
  const [liking, setLiking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
const [shareOpen, setShareOpen] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos: string[] = (data as any).photos ?? [];
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reporting, setReporting] = useState(false);

  const submitReport = async () => {
    if (!user || !reportReason) return;
    setReporting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      match_id: data.id,
      reason: reportReason,
      message: reportMessage.trim() || null,
    });
    setReporting(false);
    if (error) {
      if (error.message.includes("unique")) {
        toast.error("You've already reported this review.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    setReportOpen(false);
    setReportReason("");
    setReportMessage("");
    toast.success("Review reported. We'll look into it.");
  };

  const toggleLike = async () => {
    if (!user) return;
    setLiking(true);
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("match_id", data.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, match_id: data.id });
      setLiked(true);
      setLikeCount(c => c + 1);
      if (!isOwner) {
        await supabase.from("notifications").insert({
          user_id: data.user_id,
          actor_id: user.id,
          type: "like",
          match_id: data.id,
        });
      }
    }
    setLiking(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("matches").delete().eq("id", data.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setConfirmOpen(false);
    toast.success("Review removed.");
    onDeleted?.(data.id);
  };

  return (
    <article className="stat-card space-y-4 transition-all hover:border-primary/40 hover:shadow-elevated">
      <header className="relative flex items-start justify-between gap-3" style={{ minHeight: photos.length > 0 ? "5rem" : undefined }}>
        <div className="space-y-1.5 min-w-0" style={{ paddingRight: photos.length > 0 ? "7rem" : "3.5rem" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider ${data.is_away ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"}`}>
              {data.is_away ? "Away" : "Home"}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {data.profile?.supported_team ?? "Fan"}
            </span>
          </div>
          {data.competition && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {data.competition}
            </span>
          )}
          <h3 className="text-xl font-extrabold leading-tight">
            vs {data.opponent}
          </h3>
          <Link to={`/stadium/${data.stadium.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{data.stadium.name}</span>
          </Link>
        </div>
        <div className="absolute top-0 right-0 flex items-start gap-2">
          {photos.length > 0 && (
            <button
              onClick={() => { setPhotoIndex(0); setPhotoViewerOpen(true); }}
              className="relative h-32 w-24 rounded-xl overflow-hidden border border-border shrink-0"
            >
              <img src={photos[0]} alt="Match photo" className="h-full w-full object-cover" />
              {photos.length > 1 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-extrabold text-sm">+{photos.length - 1}</span>
                </div>
              )}
            </button>
          )}
          <GradePill value={grade} size="md" />
        </div>
      </header>

      {data.home_score != null && data.away_score != null && (() => {
        const userIsHome = !data.is_away;
        const userScore = userIsHome ? data.home_score : data.away_score;
        const oppScore = userIsHome ? data.away_score : data.home_score;
        const result = userScore > oppScore ? "W" : userScore < oppScore ? "L" : "D";
        const color = result === "W" ? "text-rating-good" : result === "L" ? "text-rating-bad" : "text-rating-mid";
        return (
          <div className="flex items-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-1.5 border border-border/50 w-fit">
            <span className={cn("font-extrabold text-sm uppercase", color)}>{result}</span>
            <span className="font-display text-lg tracking-wider">{data.home_score}–{data.away_score}</span>
          </div>
        );
      })()}

      <div className="grid grid-cols-4 gap-2">
        <Stat label={data.is_away ? "Atmos" : "Home Atmos"} value={data.atmosphere} />
        <Stat label={data.is_away ? "View" : "Away Fans"} value={data.view_rating} />
        <Stat label={data.is_away ? "Scran" : "Team"} value={data.scran} />
        <Stat label={data.is_away ? "Team" : "Logistics"} value={data.damage} />
      </div>

      {data.pint_price != null && (
        <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 border border-border/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pint Price</span>
          <span className="font-display text-xl tracking-wider text-primary">£{parseFloat(String(data.pint_price)).toFixed(2)}</span>
        </div>
      )}

      {data.motm_player && (
        <div className="flex items-start gap-2 rounded-xl bg-secondary/40 px-3 py-2 border border-border/50">
          <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              MOTM{data.profile?.supported_team ? ` · ${data.profile.supported_team}` : ""}
            </p>
            <p className="font-extrabold leading-tight truncate">{data.motm_player}</p>
            {data.motm_comment && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">"{data.motm_comment}"</p>
            )}
          </div>
        </div>
      )}

      {data.note && (
        <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary pl-3">
          "{data.note}"
        </p>
      )}

      {photoViewerOpen && (
        <PhotoViewer photos={photos} initialIndex={photoIndex} onClose={() => setPhotoViewerOpen(false)} />
      )}

      <footer className="pt-3 border-t border-border space-y-3">
        {shareOpen && <ShareScorecard data={data} onClose={() => setShareOpen(false)} />}
        {/* Top row — user info + date */}
        <div className="flex items-center justify-between">
          <Link
            to={`/user/${data.user_id}`}
            className="flex items-center gap-2 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar url={data.profile?.avatar_url} name={data.profile?.display_name} size="sm" />
            <div>
              <p className="text-sm font-extrabold text-foreground/80 leading-none">@{data.profile?.display_name ?? "fan"}</p>
              {data.profile?.match_count !== undefined && (
                <p className={`text-[10px] font-extrabold uppercase tracking-wider ${getRank(data.profile.match_count).color}`}>
                  {getRank(data.profile.match_count).label}
                </p>
              )}
            </div>
          </Link>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(parseISO(data.match_date), "d MMM yyyy")}
          </span>
        </div>

        {/* Bottom row — like + share + edit/delete */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors font-extrabold text-sm"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={toggleLike}
              disabled={liking || !user}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-1.5 border transition-colors font-extrabold text-sm",
                liked
                  ? "border-red-400/40 bg-red-400/10 text-red-400"
                  : "border-border text-muted-foreground hover:border-red-400/40 hover:text-red-400"
              )}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-red-400")} />
              <span>{likeCount > 0 ? likeCount : ""} {liked ? "Liked" : "Like"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {!isOwner && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                onClick={() => setReportOpen(true)}
                aria-label="Report review"
              >
                <Flag className="h-4 w-4" />
              </Button>
            )}
            {isOwner && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => nav(`/log/${data.id}`)}
                  aria-label="Edit review"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Delete review"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </footer>

      <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Review</AlertDialogTitle>
            <AlertDialogDescription>
              Let us know why this review seems suspicious or inappropriate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full h-10 rounded-lg bg-secondary border-0 px-3 text-sm font-bold text-foreground"
            >
              <option value="">Select a reason...</option>
              <option value="fake_review">Fake or spam review</option>
              <option value="never_attended">User likely never attended</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="wrong_info">Wrong match information</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value.slice(0, 300))}
              placeholder="Additional details (optional)"
              className="w-full rounded-lg bg-secondary border-0 px-3 py-2 text-sm text-foreground min-h-[80px] resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); submitReport(); }}
              disabled={reporting || !reportReason}
              className="bg-yellow-500 text-black font-extrabold hover:bg-yellow-400"
            >
              {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
