import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

export const AppShell = ({ children, title, right }: { children: ReactNode; title?: string; right?: ReactNode }) => (
  <div className="min-h-screen pb-28">
    {title && (
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <h1 className="font-display text-3xl tracking-wider">{title}</h1>
          {right}
        </div>
      </header>
    )}
    <main className="mx-auto max-w-md px-5 py-5">{children}</main>
    <Link
      to="/log"
      className="fixed bottom-20 right-5 z-50 h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow flex items-center justify-center transition-transform active:scale-95 hover:opacity-90"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
    <BottomNav />
  </div>
);
