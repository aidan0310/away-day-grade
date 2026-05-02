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

const EditProfile = () => {
  const nav = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [supportedTeam, setSupportedTeam] = useState(profile?.supported_team ?? "");
  const [saving, setSaving] = useState(false);
  
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