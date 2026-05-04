import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Bug, Trash2, Moon, Sun, Lock, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ReviewVisibility = "anyone" | "followers" | "only_me";

const Settings = () => {
  const nav = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [isPrivate, setIsPrivate] = useState(profile?.is_private ?? false);
  const [reviewVisibility, setReviewVisibility] = useState<ReviewVisibility>(
    (profile?.review_visibility as ReviewVisibility) ?? "anyone"
  );
  const [darkMode, setDarkMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") ||
      !document.documentElement.classList.contains("light");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    setDarkMode(!darkMode);
  };

  const savePrivacy = async (privacy: boolean, visibility: ReviewVisibility) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_private: privacy, review_visibility: visibility })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Privacy settings saved.");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Anonymise reviews
      await supabase
        .from("matches")
        .update({ user_id: "00000000-0000-0000-0000-000000000000" })
        .eq("user_id", user.id);

      // Delete profile
      await supabase.from("profiles").delete().eq("id", user.id);

      // Sign out
      await signOut();
      nav("/auth");
      toast.success("Account deleted.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not delete account");
    } finally {
      setDeleting(false);
    }
  };

  const reportBug = () => {
    window.location.href = `mailto:acmartin0310@gmail.com?subject=Bug Report - The Away End&body=Describe the bug here...`;
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-6">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Profile
        </Link>

        {/* Appearance */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Appearance</p>
          <div className="stat-card space-y-0 divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                <div>
                  <p className="font-extrabold text-sm">{darkMode ? "Dark Mode" : "Light Mode"}</p>
                  <p className="text-xs text-muted-foreground">Switch app appearance</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  darkMode ? "bg-primary" : "bg-secondary"
                )}
              >
                <span className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  darkMode ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Privacy</p>
          <div className="stat-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-extrabold text-sm">Private Profile</p>
                  <p className="text-xs text-muted-foreground">Hide your profile from non-followers</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newVal = !isPrivate;
                  setIsPrivate(newVal);
                  savePrivacy(newVal, reviewVisibility);
                }}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  isPrivate ? "bg-primary" : "bg-secondary"
                )}
              >
                <span className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  isPrivate ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-extrabold text-sm">Who can see your reviews?</p>
                  <p className="text-xs text-muted-foreground">Control review visibility</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: "anyone", label: "Anyone" },
                  { key: "followers", label: "Followers" },
                  { key: "only_me", label: "Only Me" },
                ] as { key: ReviewVisibility; label: string }[]).map((v) => (
                  <button
                    key={v.key}
                    onClick={() => {
                      setReviewVisibility(v.key);
                      savePrivacy(isPrivate, v.key);
                    }}
                    className={cn(
                      "rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition-all",
                      reviewVisibility === v.key
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {saving && <p className="text-xs text-muted-foreground">Saving...</p>}
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Support</p>
          <div className="stat-card space-y-0 divide-y divide-border">
            <button
              onClick={reportBug}
              className="flex items-center gap-3 py-3 w-full text-left hover:text-primary transition-colors"
            >
              <Bug className="h-5 w-5 text-primary" />
              <div>
                <p className="font-extrabold text-sm">Report a Bug</p>
                <p className="text-xs text-muted-foreground">Send us an email about an issue</p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Danger Zone</p>
          <div className="stat-card">
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-3 w-full text-left text-destructive hover:opacity-80 transition-opacity"
            >
              <Trash2 className="h-5 w-5" />
              <div>
                <p className="font-extrabold text-sm">Delete Account</p>
                <p className="text-xs text-destructive/70">Your reviews will be kept but anonymised</p>
              </div>
            </button>
          </div>
        </div>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This is permanent. Your profile and social data will be deleted. Your reviews will be kept but anonymised.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
};

export default Settings;