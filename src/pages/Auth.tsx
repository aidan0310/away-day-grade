import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  displayName: z.string().trim().min(2, "Name too short").max(40).optional(),
});

const Auth = () => {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signup");

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

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary glow-primary">
            <span className="font-display text-3xl text-primary-foreground">AE</span>
          </div>
          <h1 className="font-display text-5xl tracking-wider">The Away End</h1>
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
