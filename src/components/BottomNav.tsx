import { Link, useLocation } from "react-router-dom";
import { Home, User, Trophy, BarChart3, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Feed" },
  { to: "/stadiums", icon: Trophy, label: "Stadiums" },
  { to: "/matches", icon: Swords, label: "Matches" },
  { to: "/leaderboards", icon: BarChart3, label: "Boards" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ to, icon: Icon, label, primary }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          
          return (
            <Link key={to} to={to} className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold transition-colors",
              active ? "text-white" : "text-muted-foreground"
            )}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
