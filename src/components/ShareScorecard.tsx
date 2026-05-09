import { useRef, useState } from "react";
import { ReviewCardData } from "./ReviewCard";
import { gradeLabel } from "./GradePill";
import { Share2, Download, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRank } from "@/lib/ranks";

interface Props {
  data: ReviewCardData;
  onClose: () => void;
}

const avg = (d: ReviewCardData) =>
  (d.atmosphere + d.view_rating + d.scran + d.damage) / 4;

const RatingBar = ({ label, value }: { label: string; value: number }) => {
  const color =
    value >= 7.5 ? "#84cc16" : value >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: color }}>{value}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "#1f2937", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 10}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>
  );
};

export const ShareScorecard = ({ data, onClose }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const grade = avg(data);
  const letter = gradeLabel(grade);
  const rank = getRank(data.profile?.match_count ?? 0);

  const userIsHome = !data.is_away;
  const userScore = userIsHome ? data.home_score : data.away_score;
  const oppScore = userIsHome ? data.away_score : data.home_score;
  const result =
    userScore != null && oppScore != null
      ? userScore > oppScore ? "W" : userScore < oppScore ? "L" : "D"
      : null;
  const resultColor =
    result === "W" ? "#84cc16" : result === "L" ? "#ef4444" : "#f59e0b";

  const gradeColorHex =
    grade >= 7.5 ? "#84cc16" : grade >= 5 ? "#f59e0b" : "#ef4444";

  const captureAndShare = async (download = false) => {
    const { default: html2canvas } = await import("html2canvas");
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/png")
      );

     const url = URL.createObjectURL(blob);
      if (!download && navigator.share && navigator.canShare?.({ files: [new File([blob], "scorecard.png", { type: "image/png" })] })) {
        try {
          const file = new File([blob], "scorecard.png", { type: "image/png" });
          await navigator.share({ files: [file], title: "My Away Day Scorecard" });
        } catch (e) {
          // User cancelled or share failed — fall back to download
          const a = document.createElement("a");
          a.href = url;
          a.download = `away-day-${data.opponent.replace(/\s/g, "-").toLowerCase()}.png`;
          a.click();
        }
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `away-day-${data.opponent.replace(/\s/g, "-").toLowerCase()}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-5"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4">
        {/* The card that gets captured */}
        <div
          ref={cardRef}
          style={{
            background: "linear-gradient(160deg, #0f1117 0%, #161b27 60%, #0b0e14 100%)",
            borderRadius: 20,
            padding: 24,
            fontFamily: "'Inter', sans-serif",
            position: "relative",
            overflow: "hidden",
            border: "1px solid #1f2937",
          }}
        >
          {/* Glow accent */}
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 160, height: 160, borderRadius: "50%",
            background: `radial-gradient(circle, ${gradeColorHex}33 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6b7280", marginBottom: 4 }}>
                {data.is_away ? "Away Day" : "Home Day"} · The Away End
              </p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#f9fafb", lineHeight: 1.1, marginBottom: 2 }}>
                vs {data.opponent}
              </p>
              <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
                {data.stadium?.name}
              </p>
            </div>
            {/* Grade */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: gradeColorHex,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#0f1117", lineHeight: 1 }}>{letter}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#0f1117", opacity: 0.7 }}>{grade.toFixed(1)}</span>
            </div>
          </div>

          {/* Result badge */}
          {result && data.home_score != null && data.away_score != null && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#1f2937", borderRadius: 10, padding: "6px 12px",
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: resultColor }}>{result}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#f9fafb", letterSpacing: "0.05em" }}>
                {data.home_score} – {data.away_score}
              </span>
            </div>
          )}

          {/* Ratings */}
          <div style={{ marginBottom: 14 }}>
            <RatingBar label={data.is_away ? "Atmosphere" : "Home Atmos"} value={data.atmosphere} />
            <RatingBar label={data.is_away ? "The View" : "Opp Fan Noise"} value={data.view_rating} />
            <RatingBar label={data.is_away ? "Scran" : "Team Perf"} value={data.scran} />
            <RatingBar label={data.is_away ? "Team Perf" : "Logistics"} value={data.damage} />
          </div>

          {/* MOTM */}
          {data.motm_player && (
            <div style={{
              background: "#1f2937", borderRadius: 10, padding: "8px 12px",
              marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>⭐</span>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 1 }}>MOTM</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#f9fafb" }}>{data.motm_player}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderTop: "1px solid #1f2937", paddingTop: 12,
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#f9fafb" }}>@{data.profile?.display_name}</p>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: gradeColorHex }}>
                {rank.label}
              </p>
            </div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              matchdayxp.app
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => captureAndShare(false)}
            disabled={sharing}
            className="flex-1 h-12 bg-gradient-primary text-primary-foreground font-extrabold shadow-glow"
          >
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Share2 className="h-4 w-4 mr-2" /> Share</>}
          </Button>
          <Button
            onClick={() => captureAndShare(true)}
            disabled={sharing}
            variant="outline"
            className="h-12 px-4 border-border"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="h-12 px-4 border-border"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};