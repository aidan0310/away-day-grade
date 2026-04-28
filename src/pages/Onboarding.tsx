import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const popular = ["Arsenal", "Liverpool", "Man Utd", "Man City", "Chelsea", "Tottenham", "Newcastle", "Aston Villa", "Celtic", "Rangers"];

const Onboarding = () => {
  const nav = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [team, setTeam] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async (chosen: string) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ supported_team: chosen }).eq("id", user.id);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success(`Up the ${chosen}!`);
    nav("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl tracking-wider">Who do you support?</h1>
          <p className="text-muted-foreground">We'll badge your reviews on the feed.</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {popular.map((t) => (
            <button
              key={t}
              onClick={() => save(t)}
              disabled={loading}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold transition-all hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type your team</Label>
          <Input
            value={team}
            onChange={(e) => setTeam(e.target.value.slice(0, 50))}
            placeholder="e.g. Wrexham AFC"
            className="h-12 bg-card"
          />
          <Button
            onClick={() => team.trim() && save(team.trim())}
            disabled={loading || team.trim().length < 2}
            className="w-full h-12 bg-gradient-primary text-primary-foreground font-extrabold shadow-glow"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save my team"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
