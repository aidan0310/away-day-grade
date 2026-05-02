import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { clubForName, hexToHslString, readableForegroundHsl } from "@/lib/premier-league";
import { allClubForName } from "@/lib/all-clubs";

const hexToHslParts = (hex: string): { h: number; s: number; l: number } => {
  const h = hex.replace("#", "").trim();
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
  }
  return { h: Math.round(hue), s: Math.round(s * 100), l: Math.round(l * 100) };
};

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

    const isUsable = (hex: string) => {
      const { l } = hexToHslParts(hex);
      return l > 10 && l < 90;
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

    const usableSecondary = isUsable(effectiveSecondary) ? secondaryHsl : primaryHsl;

    // Only override primary/accent colours — keep background/card dark
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", primaryHsl);
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);
    root.style.setProperty("--sidebar-ring", primaryHsl);
    root.style.setProperty("--accent", secondaryHsl);
    root.style.setProperty("--accent-foreground", readableForegroundHsl(effectiveSecondary));
    root.style.setProperty("--border", `${hexToHslParts(effectivePrimary).h} 20% 20%`);
    root.style.setProperty("--sidebar-border", `${hexToHslParts(effectivePrimary).h} 20% 20%`);
    root.style.setProperty("--gradient-primary", `hsl(${usableSecondary})`);
    root.style.setProperty("--shadow-glow", `0 0 40px hsl(${primaryHsl} / 0.4)`);

    return () => {
      tokens.forEach((t) => root.style.removeProperty(t));
    };
  }, [teamName]);

  return null;
};