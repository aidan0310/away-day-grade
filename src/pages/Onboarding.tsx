import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ChevronDown } from "lucide-react";
import { ALL_FOOTBALL_CLUBS } from "@/lib/all-clubs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const Onboarding = () => {
  const nav = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [team, setTeam] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = ALL_FOOTBALL_CLUBS.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const pick = (name: string) => {
    setTeam(name);
    setQuery(name);
    setOpen(false);
  };

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
          <p className="text-muted-foreground">Search across all 92 Football League clubs.</p>
        </div>

        <div className="space-y-3">
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
                <CommandInput
                  placeholder="Type a club name..."
                  value={query}
                  onValueChange={setQuery}
                />
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