import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { clubForName, hexToHslString, readableForegroundHsl } from "@/lib/premier-league";
import { allClubForName } from "@/lib/all-clubs";

export const ClubTheme = () => {
  const { profile } = useAuth();
  const teamName = profile?.supported_team ?? "";

  useEffect(() => {
    const root = document.documentElement;
    const tokens = [
      "--primary", "--primary-foreground", "--ring",
      "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
      "--accent", "--accent-foreground", "--border", "--sidebar-border",
      "--gradient-primary", "--shadow-glow",
    ];

    const plClub = teamName ? clubForName(teamName) : undefined;
    const eflClub = teamName ? allClubForName(teamName) : undefined;
    const club = plClub ?? eflClub;

    if (!club) {
      tokens.forEach((t) => root.style.removeProperty(t));
      return;
    }

    // Pick a usable primary — avoid pure black/white
    const isUsable = (hex: string) => {
      const h = hex.replace("#", "");
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
      return l > 0.1 && l < 0.95;
    };

    const effectivePrimary = isUsable(club.primaryHex)
      ? club.primaryHex
      : isUsable(club.secondaryHex)
        ? club.secondaryHex
        : null;

    if (!effectivePrimary) {
      tokens.forEach((t) => root.style.removeProperty(t));
      return;
    }

    const effectiveSecondary = effectivePrimary === club.primaryHex
      ? club.secondaryHex
      : club.primaryHex;

    const primaryHsl = hexToHslString(effectivePrimary);
    const secondaryHsl = hexToHslString(effectiveSecondary);
    const primaryFg = readableForegroundHsl(effectivePrimary);
    const secondaryFg = readableForegroundHsl(effectiveSecondary);

    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", primaryHsl);
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);
    root.style.setProperty("--sidebar-ring", primaryHsl);
    root.style.setProperty("--accent", secondaryHsl);
    root.style.setProperty("--accent-foreground", secondaryFg);
    root.style.setProperty("--border", `${secondaryHsl.split(" ")[0]} 30% 22%`);
    root.style.setProperty("--sidebar-border", `${secondaryHsl.split(" ")[0]} 30% 22%`);
    root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${primaryHsl}), hsl(${secondaryHsl}))`);
    root.style.setProperty("--shadow-glow", `0 0 40px hsl(${primaryHsl} / 0.35)`);

    return () => {
      tokens.forEach((t) => root.style.removeProperty(t));
    };
  }, [teamName]);

  return null;
};