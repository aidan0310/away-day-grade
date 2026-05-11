import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ChevronDown, Trophy, Star, BarChart3, ArrowRight, Check, UserPlus } from "lucide-react";
import { ALL_FOOTBALL_CLUBS } from "@/lib/all-clubs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { allClubForName } from "@/lib/all-clubs";
import { getRank } from "@/lib/ranks";
import { Avatar } from "@/components/Avatar";

type Step = 1 | 2 | 3 | 4;

type SuggestedUser = {
  id: string;
  display_name: string;
  supported_team: string | null;
  avatar_url: string | null;
  match_count: number;
};

const Onboarding = () => {
  const nav = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [team, setTeam] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [loading, setLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  const filtered = ALL_FOOTBALL_CLUBS.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (name: string) => {
    setTeam(name);
    setQuery(name);
    setOpen(false);
  };

  const selectedClub = team ? allClubForName(team) : null;

  // Load suggested users when reaching step 4
  useEffect(() => {
    if (step !== 4 || !user) return;
    (async () => {
      setLoading(true);
      const { data: allMatches } = await supabase.from("matches").select("user_id");
      if (!allMatches) { setLoading(false); return; }

      const countMap = new Map<string, number>();
      allMatches.forEach((m: any) => {
        countMap.set(m.user_id, (countMap.get(m.user_id) ?? 0) + 1);
      });

      const userIds = [...countMap.keys()].filter(id => id !== user.id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, supported_team, avatar_url")
        .in("id", userIds);

      const ranked = (profiles ?? [])
        .map((p: any) => ({ ...p, match_count: countMap.get(p.id) ?? 0 }))
        .sort((a: any, b: any) => b.match_count - a.match_count)
        .slice(0, 8);

      setSuggestedUsers(ranked);
      setLoading(false);
    })();
  }, [step, user]);

  const saveStep1 = async () => {
    if (!user || !team) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ supported_team: team }).eq("id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    setStep(2);
  };

  const saveStep2 = async () => {
    if (!user) return;
    if (displayName.trim().length < 2) { toast.error("Name must be at least 2 characters."); return; }
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    setStep(3);
  };

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    setFollowLoading(targetId);
    if (followedIds.has(targetId)) {
      await supabase.from("follows").delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetId);
      setFollowedIds(prev => { const s = new Set(prev); s.delete(targetId); return s; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowedIds(prev => new Set(prev).add(targetId));
    }
    setFollowLoading(null);
  };

  return (
    <div className="min-h-screen flex flex-col px-5 py-10">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-all",
              s <= step ? "bg-primary" : "bg-secondary"
            )}
          />
        ))}
      </div>

      {/* Step 1 — Pick your club */}
      {step === 1 && (
        <div className="flex-1 flex flex-col space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Step 1 of 4</p>
            <h1 className="font-display text-4xl tracking-wider">Who do you support?</h1>
            <p className="text-muted-foreground">Search across all 92 Football League clubs.</p>
          </div>

          {selectedClub && (
            <div
              className="rounded-2xl p-4 flex items-center gap-4 transition-all"
              style={{ background: selectedClub.primaryHex }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center font-display text-xl font-extrabold"
                style={{ background: selectedClub.secondaryHex, color: selectedClub.primaryHex }}
              >
                {selectedClub.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-extrabold text-lg" style={{ color: selectedClub.secondaryHex }}>
                  {selectedClub.name}
                </p>
                <p className="text-xs font-bold opacity-70" style={{ color: selectedClub.secondaryHex }}>
                  {selectedClub.league} · {selectedClub.stadium}
                </p>
              </div>
            </div>
          )}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "h-12 w-full rounded-md bg-card border border-border px-3 flex items-center justify-between text-sm font-bold",
                  !team && "text-muted-foreground"
                )}
              >
                <span className="truncate">{team || "Search for your club..."}</span>
                <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] bg-popover" align="start">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Type a club name..." value={query} onValueChange={setQuery} />
                <CommandList className="max-h-[300px]">
                  {filtered.length === 0 ? (
                    <CommandEmpty>No clubs found.</CommandEmpty>
                  ) : (
                    <>
                      {["Premier League", "Championship", "League One", "League Two"].map(league => {
                        const clubs = filtered.filter(c => c.league === league);
                        if (clubs.length === 0) return null;
                        return (
                          <CommandGroup key={league} heading={league}>
                            {clubs.map(c => (
                              <CommandItem key={c.name} value={c.name} onSelect={() => pick(c.name)}>
                                {c.name}
                                {team === c.name && <Check className="ml-auto h-4 w-4 text-primary" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        );
                      })}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="mt-auto pt-8">
            <Button
              onClick={saveStep1}
              disabled={loading || !team}
              className="w-full h-14 bg-gradient-primary text-primary-foreground font-extrabold shadow-glow text-base"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5 ml-2" /></>}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Display name */}
      {step === 2 && (
        <div className="flex-1 flex flex-col space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Step 2 of 4</p>
            <h1 className="font-display text-4xl tracking-wider">What's your terrace name?</h1>
            <p className="text-muted-foreground">This is how other fans will see you.</p>
          </div>

          <div className="space-y-2">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. ultra_2003"
              className="h-14 bg-card border-border font-bold text-lg"
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground">{displayName.length}/40 characters</p>
          </div>

          <div className="mt-auto pt-8 space-y-3">
            <Button
              onClick={saveStep2}
              disabled={loading || displayName.trim().length < 2}
              className="w-full h-14 bg-gradient-primary text-primary-foreground font-extrabold shadow-glow text-base"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5 ml-2" /></>}
            </Button>
            <button
              onClick={() => setStep(3)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — All set explainer */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <div className="space-y-3">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
              <span className="text-4xl">🏟️</span>
            </div>
            <h1 className="font-display text-4xl tracking-wider">You're in the stand.</h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Here's everything you can do on MatchDayXP.
            </p>
          </div>

          <div className="w-full space-y-3">
            {[
              { icon: Trophy, title: "Rate every ground", desc: "Score atmosphere, scran, view and your team's performance after every away day." },
              { icon: Star, title: "Vote for MOTM", desc: "Pick your Man of the Match and see who other fans rated." },
              { icon: BarChart3, title: "Climb the ranks", desc: "Go from Casual to Legend the more matches you log." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="stat-card flex items-start gap-4 text-left">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-extrabold">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full space-y-3 pt-4">
            <Button
              onClick={() => setStep(4)}
              className="w-full h-14 bg-gradient-primary text-primary-foreground font-extrabold shadow-glow text-base"
            >
              Next <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Find fans to follow */}
      {step === 4 && (
        <div className="flex-1 flex flex-col space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Step 4 of 4</p>
            <h1 className="font-display text-4xl tracking-wider">Find fans to follow.</h1>
            <p className="text-muted-foreground">Follow the most active fans to fill your feed.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : suggestedUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No other fans yet — you're early!</p>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              {suggestedUsers.map((u) => {
                const rank = getRank(u.match_count);
                const isFollowing = followedIds.has(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 border-t border-border/60 first:border-0"
                  >
                    <Avatar url={u.avatar_url} name={u.display_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold truncate">@{u.display_name}</p>
                      <p className="text-xs text-muted-foreground">{u.supported_team ?? "No team"}</p>
                      <p className={`text-[10px] font-extrabold uppercase tracking-wider ${rank.color}`}>{rank.label}</p>
                    </div>
                    <button
                      onClick={() => toggleFollow(u.id)}
                      disabled={followLoading === u.id}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all shrink-0",
                        isFollowing
                          ? "bg-secondary text-foreground border border-border"
                          : "bg-gradient-primary text-primary-foreground shadow-glow"
                      )}
                    >
                      {followLoading === u.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : isFollowing ? <><Check className="h-3 w-3 inline mr-1" />Following</> : <><UserPlus className="h-3 w-3 inline mr-1" />Follow</>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto space-y-3 pt-4">
            <Button
              onClick={() => nav("/log")}
              className="w-full h-14 bg-gradient-primary text-primary-foreground font-extrabold shadow-glow text-base"
            >
              Log your first match <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <button
              onClick={() => nav("/")}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Explore the feed first
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;