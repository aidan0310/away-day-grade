import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Camera } from "lucide-react";
import { Avatar } from "@/components/Avatar";

const EditProfile = () => {
  const nav = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (updateError) throw updateError;

      setAvatarUrl(url);
      await refreshProfile();
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message ?? "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

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
        .update({ display_name: displayName.trim() })
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

        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar url={avatarUrl} name={profile?.display_name} size="lg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow"
            >
              {uploading
                ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                : <Camera className="h-4 w-4 text-primary-foreground" />
              }
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Tap the camera to change your photo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar(file);
            }}
          />
        </div>

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