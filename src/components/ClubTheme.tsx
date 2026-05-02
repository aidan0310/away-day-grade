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
      "--background", "--foreground",
      "--card", "--card-foreground",
      "--muted", "--muted-foreground",
      "--secondary", "--secondary-foreground",
      "--popover", "--popover-foreground",
    ];

    const plClub = teamName ? clubForName(teamName) : undefined;
    const eflClub = teamName ? allClubForName(teamName) : undefined;
    const club = plClub ?? eflClub;

    if (!club) {
      tokens.forEach((t) => root.style.removeProperty(t));
      return;
    }

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

    // Work out if the club is "dark" or "light" based on primary lightness
    const primaryL = parseInt(primaryHsl.split(" ")[2]);
    const isDark = primaryL < 50;

    // Background is a very dark/light shade of the primary hue
    const [hue, sat] = primaryHsl.split(" ");
    const bgL = isDark ? "8%" : "92%";
    const cardL = isDark ? "13%" : "87%";
    const mutedL = isDark ? "18%" : "82%";
    const fgL = isDark ? "95%" : "8%";
    const mutedFgL = isDark ? "65%" : "35%";

    const bgHsl = `${hue} ${sat} ${bgL}`;
    const cardHsl = `${hue} ${sat} ${cardL}`;
    const mutedHsl = `${hue} ${sat} ${mutedL}`;
    const fgHsl = `${hue} 5% ${fgL}`;
    const mutedFgHsl = `${hue} 10% ${mutedFgL}`;

    // Core colours
    root.style.setProperty("--background", bgHsl);
    root.style.setProperty("--foreground", fgHsl);
    root.style.setProperty("--card", cardHsl);
    root.style.setProperty("--card-foreground", fgHsl);
    root.style.setProperty("--muted", mutedHsl);
    root.style.setProperty("--muted-foreground", mutedFgHsl);
    root.style.setProperty("--secondary", mutedHsl);
    root.style.setProperty("--secondary-foreground", fgHsl);
    root.style.setProperty("--popover", cardHsl);
    root.style.setProperty("--popover-foreground", fgHsl);

    // Primary/accent
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", primaryHsl);
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);
    root.style.setProperty("--sidebar-ring", primaryHsl);
    root.style.setProperty("--accent", secondaryHsl);
    root.style.setProperty("--accent-foreground", readableForegroundHsl(effectiveSecondary));

    // Border
    root.style.setProperty("--border", `${hue} ${sat} ${isDark ? "22%" : "75%"}`);
    root.style.setProperty("--sidebar-border", `${hue} ${sat} ${isDark ? "22%" : "75%"}`);

    // Gradient and glow
    root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${primaryHsl}), hsl(${secondaryHsl}))`);
    root.style.setProperty("--shadow-glow", `0 0 40px hsl(${primaryHsl} / 0.35)`);

    return () => {
      tokens.forEach((t) => root.style.removeProperty(t));
    };
  }, [teamName]);

  return null;
};