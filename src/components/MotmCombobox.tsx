import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, Flame, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  /** The club whose player is being voted MOTM (opposition for away, your club for home). */
  club: string;
  value: string;
  onChange: (v: string) => void;
}

interface PlayerRow { id: string; name: string; }
interface TrendingRow { player: string; votes: number; }

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export const MotmCombobox = ({ club, value, onChange }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [trending, setTrending] = useState<TrendingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => { setQuery(value); }, [value]);
useEffect(() => { setQuery(""); }, [club]);

  // Load trending whenever club changes / popover opens
  useEffect(() => {
    if (!open || !club) return;
    supabase.rpc("trending_motm", { _club: club, _limit: 5 }).then(({ data }) => {
      setTrending((data as TrendingRow[]) ?? []);
    });
  }, [open, club]);

  // Search players for the club, debounced
  useEffect(() => {
    if (!open || !club) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      let q = supabase
        .from("global_players")
        .select("id,name")
        .eq("club", club)
        .order("name", { ascending: true })
        .limit(20);
      const term = query.trim();
      if (term) q = q.ilike("name_normalized", `%${norm(term)}%`);
      const { data } = await q;
      setPlayers((data as PlayerRow[]) ?? []);
      setLoading(false);
    }, 180);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, club, open]);

  const trimmed = query.trim();
  const exists = useMemo(
    () => players.some((p) => norm(p.name) === norm(trimmed)),
    [players, trimmed]
  );
  const canAdd = trimmed.length >= 2 && !exists && !!club;

  const pick = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  const addNew = async () => {
    if (!canAdd || !user) return;
    setAdding(true);
    const name = trimmed.replace(/\s+/g, " ");
    const { data, error } = await supabase
      .from("global_players")
      .insert({ club, name, name_normalized: norm(name), created_by: user.id })
      .select("id,name")
      .maybeSingle();
    setAdding(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not save player");
      return;
    }
    pick(data?.name ?? name);
    toast.success(`${name} added to ${club}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={!club}
          className={cn(
            "h-12 w-full rounded-md bg-secondary px-3 flex items-center justify-between text-sm font-bold border-0",
            !value && "text-muted-foreground",
            !club && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="truncate">
            {value || (club ? `Pick your ${club} MOTM` : "Set your club in profile first")}
          </span>
          <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] bg-popover" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type a player name..."
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdd) {
                e.preventDefault();
                addNew();
              }
            }}
          />
          <CommandList className="max-h-[320px]">
            {trending.length > 0 && !trimmed && (
              <CommandGroup heading={`Trending ${club} players`}>
                {trending.map((t) => (
                  <CommandItem key={`t-${t.player}`} value={t.player} onSelect={() => pick(t.player)}>
                    <Flame className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-bold">{t.player}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{t.votes} vote{t.votes === 1 ? "" : "s"}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {players.length > 0 && (
              <CommandGroup heading={trimmed ? "Matches" : `${club} players`}>
                {players.map((p) => (
                  <CommandItem key={p.id} value={p.name} onSelect={() => pick(p.name)}>
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {loading && (
              <div className="py-6 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && players.length === 0 && trending.length === 0 && !trimmed && (
              <CommandEmpty>Start typing to find a player.</CommandEmpty>
            )}

            {canAdd && (
              <div className="border-t border-border p-2">
                <Button
                  type="button"
                  onClick={addNew}
                  disabled={adding}
                  className="w-full h-10 bg-gradient-primary text-primary-foreground font-extrabold"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <><Plus className="h-4 w-4 mr-1" /> Add "{trimmed}" to {club}</>
                  )}
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
