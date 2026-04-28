import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

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
    <BottomNav />
  </div>
);
