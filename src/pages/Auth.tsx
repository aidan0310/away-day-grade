import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Trophy, Star, BarChart3, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  displayName: z.string().trim().min(2, "Name too short").max(40).optional(),
});

type Screen = "landing" | "auth";

const EXAMPLE_REVIEWS = [
  { opponent: "Man City", stadium: "Etihad Stadium", grade: "A", score: "8.2", result: "W", type: "Away" },
  { opponent: "Liverpool", stadium: "Anfield", grade: "B", score: "6.5", result: "L", type: "Away" },
  { opponent: "Chelsea", stadium: "Stamford Bridge", grade: "S", score: "9.1", result: "W", type: "Away" },
];

const Auth = () => {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [screen, setScreen] = useState<Screen>("landing");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
      displayName: mode === "signup" ? fd.get("displayName") : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: parsed.data.displayName },
          },
        });
        if (error) throw error;
        toast.success("Welcome to The Away End!");
        nav("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Back in the stand.");
        nav("/");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (screen === "landing") {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 pt-16 pb-8 text-center space-y-6">
          <div className="space-y-3">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
              <span className="font-display text-4xl text-primary-foreground">AE</span>
            </div>
            <h1 className="font-display text-5xl tracking-wider">MatchDayXP</h1>
            <p className="text-muted-foreground text-lg max-w-xs mx-auto leading-relaxed">
              Rate every away day. Build your terrace legacy. Join the fans.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { icon: Trophy, label: "Rate Stadiums" },
              { icon: Star, label: "Vote MOTM" },
              { icon: BarChart3, label: "Climb the Ranks" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>

          {/* Example review cards */}
          <div className="w-full max-w-sm space-y-2">
            {EXAMPLE_REVIEWS.map((r) => (
              <div key={r.opponent} className="stat-card flex items-center gap-3">
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                      {r.type}
                    </span>
                    <span className={cn(
                      "text-xs font-extrabold",
                      r.result === "W" ? "text-rating-good" : r.result === "L" ? "text-rating-bad" : "text-rating-mid"
                    )}>{r.result}</span>
                  </div>
                  <p className="font-extrabold text-sm">vs {r.opponent}</p>
                  <p className="text-xs text-muted-foreground">{r.stadium}</p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-display",
                  r.grade === "S" ? "bg-rating-good text-primary-foreground" :
                  r.grade === "A" ? "bg-rating-good text-primary-foreground" :
                  "bg-rating-mid text-primary-foreground"
                )}>
                  <span className="text-xl leading-none">{r.grade}</span>
                  <span className="text-[9px] opacity-80">{r.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-10 space-y-3">
          <Button
            onClick={() => { setMode("signup"); setScreen("auth"); }}
            className="w-full h-14 text-base font-extrabold bg-gradient-primary text-primary-foreground shadow-glow"
          >
            Get Started <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button
            onClick={() => { setMode("signin"); setScreen("auth"); }}
            variant="outline"
            className="w-full h-12 text-base font-extrabold border-border"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary glow-primary">
            <span className="font-display text-3xl text-primary-foreground">AE</span>
          </div>
          <h1 className="font-display text-5xl tracking-wider">MatchDayXP</h1>
          <p className="text-muted-foreground">Rate every match day. Build your terrace legacy.</p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="signup">Sign up</TabsTrigger>
            <TabsTrigger value="signin">Sign in</TabsTrigger>
          </TabsList>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <TabsContent value="signup" className="space-y-4 mt-0">
              <Field label="Display name" name="displayName" placeholder="ultra_2003" />
            </TabsContent>
            <Field label="Email" name="email" type="email" placeholder="you@email.com" />
            <Field label="Password" name="password" type="password" placeholder="••••••••" />

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-extrabold bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === "signup" ? "Create account" : "Sign in")}
            </Button>
          </form>
        </Tabs>

        <button
          onClick={() => setScreen("landing")}
          className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

const Field = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-2">
    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
    <Input {...props} className="h-12 bg-card border-border" />
  </div>
);

export default Auth;