import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Loader2, ArrowLeft, Heart, UserPlus } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatDistanceToNow, parseISO } from "date-fns";

type Notification = {
  id: string;
  type: "follow" | "like";
  read: boolean;
  created_at: string;
  match_id: string | null;
  actor: {
    id: string;
    display_name: string;
    supported_team: string | null;
    avatar_url: string | null;
  } | null;
  
const Notifications = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, read, created_at, match_id, actor:actor_id(id, display_name, supported_team)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications((data ?? []) as Notification[]);

      // Mark all as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setLoading(false);
    })();
  }, [user]);

  return (
    <AppShell title="Notifications">
      <div className="space-y-5">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Feed
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No notifications yet.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (n.type === "follow" && n.actor) nav(`/user/${n.actor.id}`);
                  if (n.type === "like" && n.match_id) nav(`/`);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors border-t border-border/60 first:border-0 ${!n.read ? "bg-primary/5" : "hover:bg-secondary/40"}`}
              >
                <div className="relative shrink-0">
                  <Avatar url={n.actor?.avatar_url} name={n.actor?.display_name} size="md" />
                  <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-lg flex items-center justify-center ${n.type === "like" ? "bg-red-400" : "bg-primary"}`}>
                    {n.type === "like"
                      ? <Heart className="h-3 w-3 text-white" />
                      : <UserPlus className="h-3 w-3 text-primary-foreground" />
                    }
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold truncate">
                    @{n.actor?.display_name ?? "Someone"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {n.type === "like" ? "liked your review" : "started following you"}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Notifications;