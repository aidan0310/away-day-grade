import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ALL_FOOTBALL_CLUBS } from "@/lib/all-clubs";

const Onboarding = () => {
  const nav = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [team, setTeam] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!user || !team) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ supported_team: team }).eq("id", user.id);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success(`Up the ${team}!`);
    nav("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-4xl tracking-wider">Who do you support?</h1>
          <p className="text-muted-foreground">Premier League clubs only. We'll badge your reviews on the feed.</p>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your club</Label>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="h-12 bg-card">
              <SelectValue placeholder="Pick your Premier League club" />
            </SelectTrigger>
            <SelectContent className="max-h-80 bg-card">
              {ALL_FOOTBALL_CLUBS.map((c) => (
                <SelectItem key={c.name} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={save}
            disabled={loading || !team}
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
