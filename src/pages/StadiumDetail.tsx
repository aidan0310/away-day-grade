import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ReviewCard, ReviewCardData } from "@/components/ReviewCard";
import { LetterGrade } from "@/components/GradePill";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "away" | "home";

const StadiumDetail = () => {
  const { id } = useParams();
  const [stadium, setStadium] = useState<{ name: string } | null>(null);
  const [reviews, setReviews] = useState<ReviewCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("away");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: s } = await supabase.from("stadiums").select("name").eq("id", id).maybeSingle();
      setStadium(s);
      const { data: matches } = await supabase
        .from("matches")
        .select("*, stadium:stadiums(id,name)")
        .eq("stadium_id", id)
        .order("created_at", { ascending: false });
      const userIds = [...new Set((matches ?? []).map((m: any) => m.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, supported_team").in("id", userIds);
      const pmap = new Map((profiles ?? []).map(p => [p.id, p]));
      setReviews((matches ?? []).map((m: any) => ({ ...m, profile: pmap.get(m.user_id) ?? null })));
      setLoading(false);
    })();
  }, [id]);

  const awayReviews = reviews.filter(r => r.is_away);
  const homeReviews = reviews.filter(r => !r.is_away);
  const displayed = tab === "away" ? awayReviews : homeReviews;

  const calcAvgs = (rs: ReviewCardData[]) => rs.length ? {
    atmosphere: avg(rs.map(r => r.atmosphere)),
    view: avg(rs.map(r => r.view_rating)),
    scran: avg(rs.map(r => r.scran)),
    damage: avg(rs.map(r => r.damage)),
  } : null;

  const avgs = calcAvgs(displayed);
  const overall = avgs ? (avgs.atmosphere + avgs.view + avgs.scran + avgs.damage) / 4 : 0;
  const pintPrices = displayed.map(r => r.pint_price).filter((p): p is number => p != null).map(Number);
  const avgPint = pintPrices.length ? pintPrices.reduce((a, b) => a + b, 0) / pintPrices.length : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link to="/stadiums" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Stadiums
        </Link>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <h1 className="font-display text-4xl tracking-wider leading-none">{stadium?.name}</h1>

            {/* Tabs */}
            <div className="flex gap-2">
              {([
                { key: "away", label: `Away Reviews (${awayReviews.length})` },
                { key: "home", label: `Home Reviews (${homeReviews.length})` },
              ] as { key: Tab; label: string }[]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all",
                    tab === t.key
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "bg-card text-muted-foreground border border-border"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {avgs ? (
              <>
                <div className="stat-card flex items-center gap-5">
                  <LetterGrade value={overall} size="lg" />
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      {tab === "away" ? "Away Day Grade" : "Home Day Grade"}
                    </p>
                    <p className="font-display text-5xl tracking-wider leading-none">{overall.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{displayed.length} {displayed.length === 1 ? "review" : "reviews"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {tab === "away" ? (
                    <>
                      <Mini label="Atmos" v={avgs.atmosphere} />
                      <Mini label="View" v={avgs.view} />
                      <Mini label="Scran" v={avgs.scran} />
                      <Mini label="Team" v={avgs.damage} />
                    </>
                  ) : (
                    <>
                      <Mini label="Atmos" v={avgs.atmosphere} />
                      <Mini label="Away Fans" v={avgs.view} />
                      <Mini label="Team" v={avgs.scran} />
                      <Mini label="Logistics" v={avgs.damage} />
                    </>
                  )}
                </div>

                {avgPint != null && (
                  <div className="stat-card flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Avg Pint Price</p>
                      <p className="text-xs text-muted-foreground mt-1">From {pintPrices.length} {pintPrices.length === 1 ? "report" : "reports"}</p>
                    </div>
                    <span className="font-display text-4xl tracking-wider text-primary">£{avgPint.toFixed(2)}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No {tab} reviews yet for this stadium.</p>
            )}

            <div className="space-y-3">
              <h2 className="font-display text-2xl tracking-wider">Reviews</h2>
              {displayed.length === 0 ? (
                <p className="text-muted-foreground text-sm">No {tab} reviews yet.</p>
              ) : displayed.map(r => (
                <ReviewCard
                  key={r.id}
                  data={r}
                  onDeleted={(id) => setReviews(rs => rs.filter(x => x.id !== id))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

const Mini = ({ label, v }: { label: string; v: number }) => (
  <div className="stat-card !p-3 flex flex-col items-center">
    <span className="font-display text-2xl tracking-wider leading-none">{v.toFixed(1)}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
  </div>
);

export default StadiumDetail;