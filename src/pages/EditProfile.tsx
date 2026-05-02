import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { ALL_FOOTBALL_CLUBS } from "@/lib/all-clubs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const EditProfile = () => {
  const nav = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [supportedTeam, setSupportedTeam] = useState(profile?.supported_team ?? "");
  const [saving, setSaving] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
  const [clubQuery, setClubQuery] = useState(profile?.supported_team ?? "");
  const filteredClubs = ALL_FOOTBALL_CLUBS.filter(c =>
    c.name.toLowerCase().includes(clubQuery.toLowerCase())
  );

  const save = async () => {
    if (!user) return;
    if (displayName.trim().length < 2) {
      toast.error("Display name must be at least 2 characters.");
      return;
    }
    if (displayName.trim().length > 40) {
      toast.error("Display name must be under 40 characters.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          supported_team: supportedTeam || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated!");
      nav("/profile");
    } catch (err: any) {
      toast.error(err.message ?? "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Edit Profile">
      <div className="space-y-6">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Profile
        </Link>

        <div className="space-y-4 stat-card">
          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Display Name
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="h-12 bg-secondary border-0 font-bold"
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground">{displayName.length}/40 characters</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Supported Club
            </Label>
            <Popover open={clubOpen} onOpenChange={setClubOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "h-12 w-full rounded-md bg-secondary border-0 px-3 flex items-center justify-between text-sm font-bold",
                    !supportedTeam && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">{supportedTeam || "Search for your club..."}</span>
                  <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] bg-popover" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type a club name..."
                    value={clubQuery}
                    onValueChange={setClubQuery}
                  />
                  <CommandList className="max-h-[300px]">
                    {filteredClubs.length === 0 ? (
                      <CommandEmpty>No clubs found.</CommandEmpty>
                    ) : (
                      <>
                        {["Premier League", "Championship", "League One", "League Two"].map(league => {
                          const clubs = filteredClubs.filter(c => c.league === league);
                          if (clubs.length === 0) return null;
                          return (
                            <CommandGroup key={league} heading={league}>
                              {clubs.map(c => (
                                <CommandItem key={c.name} value={c.name} onSelect={() => { setSupportedTeam(c.name); setClubQuery(c.name); setClubOpen(false); }}>
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
          </div>
        </div>

        <Button
          onClick={save}
          disabled={saving}
          className="w-full h-12 bg-gradient-primary text-primary-foreground font-extrabold shadow-glow"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
        </Button>
      </div>
    </AppShell>
  );
};

export default EditProfile;