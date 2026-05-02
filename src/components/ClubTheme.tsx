import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { clubForName, hexToHslString, readableForegroundHsl } from "@/lib/premier-league";
import { allClubForName } from "@/lib/all-clubs";

/**
 * Applies the supported club's brand colors to the app by overriding
 * the core HSL design tokens on :root. No-op until a Premier League
 * club is loaded from the user's profile.
 */
export const ClubTheme = () => {
  const { profile } = useAuth();
  const teamName = profile?.supported_team ?? "";

  useEffect(() => {
    const root = document.documentElement;
    const tokens = [
      "--primary",
      "--primary-foreground",
      "--ring",
      "--sidebar-primary",
      "--sidebar-primary-foreground",
      "--sidebar-ring",
      "--accent",
      "--accent-foreground",
      "--border",
      "--sidebar-border",
      "--gradient-primary",
      "--shadow-glow",
    ];

    const plClub = teamName ? clubForName(teamName) : undefined;
    const eflClub = teamName ? allClubForName(teamName) : undefined;
    const club = plClub ?? eflClub;
    if (!club) {
      tokens.forEach((t) => root.style.removeProperty(t));
      return;
    }

    const primaryHsl = hexToHslString(club.primaryHex);
    const secondaryHsl = hexToHslString(club.secondaryHex);
    const primaryFg = readableForegroundHsl(club.primaryHex);
    const secondaryFg = readableForegroundHsl(club.secondaryHex);

    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--ring", primaryHsl);
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);
    root.style.setProperty("--sidebar-ring", primaryHsl);

    root.style.setProperty("--accent", secondaryHsl);
    root.style.setProperty("--accent-foreground", secondaryFg);

    // Subtle border tint using the secondary brand color.
    root.style.setProperty("--border", `${secondaryHsl.split(" ")[0]} 30% 22%`);
    root.style.setProperty("--sidebar-border", `${secondaryHsl.split(" ")[0]} 30% 22%`);

    root.style.setProperty(
      "--gradient-primary",
      `linear-gradient(135deg, hsl(${primaryHsl}), hsl(${secondaryHsl}))`
    );
    root.style.setProperty("--shadow-glow", `0 0 40px hsl(${primaryHsl} / 0.35)`);

    return () => {
      tokens.forEach((t) => root.style.removeProperty(t));
    };
  }, [teamName]);

  return null;
};
