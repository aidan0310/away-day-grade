import { ALL_FOOTBALL_CLUBS } from "@/lib/all-clubs";

export type PLClub = {
  name: string;
  stadium: string;
  primaryHex: string;
  secondaryHex: string;
};

// Derived from all-clubs.ts — single source of truth
export const PREMIER_LEAGUE_CLUBS: PLClub[] = ALL_FOOTBALL_CLUBS
  .filter(c => c.league === "Premier League")
  .map(c => ({
    name: c.name,
    stadium: c.stadium,
    primaryHex: c.primaryHex,
    secondaryHex: c.secondaryHex,
  }));

export const CLUB_NAMES = PREMIER_LEAGUE_CLUBS.map((c) => c.name);

const CLUB_ALIASES: Record<string, string> = {
  "man city": "Manchester City",
  "manchester city": "Manchester City",
  "man utd": "Manchester United",
  "man united": "Manchester United",
  "manchester united": "Manchester United",
  "spurs": "Tottenham Hotspur",
  "tottenham": "Tottenham Hotspur",
  "tottenham hotspur": "Tottenham Hotspur",
  "wolves": "Wolverhampton Wanderers",
  "wolverhampton": "Wolverhampton Wanderers",
  "wolverhampton wanderers": "Wolverhampton Wanderers",
  "brighton": "Brighton & Hove Albion",
  "brighton and hove albion": "Brighton & Hove Albion",
  "brighton & hove albion": "Brighton & Hove Albion",
  "leeds": "Leeds United",
  "leeds united": "Leeds United",
  "newcastle": "Newcastle United",
  "newcastle united": "Newcastle United",
  "nottingham forest": "Nottingham Forest",
  "forest": "Nottingham Forest",
  "west ham": "West Ham United",
  "west ham united": "West Ham United",
  "nott'm forest": "Nottingham Forest",
  "afc bournemouth": "AFC Bournemouth",
  "bournemouth": "AFC Bournemouth",
};

export const normalizeClubName = (club: string): string => {
  const key = club.trim().toLowerCase();
  return CLUB_ALIASES[key] ?? club.trim();
};

export const stadiumForClub = (club: string): string | undefined => {
  const normalizedClub = normalizeClubName(club);
  return PREMIER_LEAGUE_CLUBS.find((c) => c.name === normalizedClub)?.stadium;
};

export const clubForName = (club: string): PLClub | undefined => {
  const normalizedClub = normalizeClubName(club);
  return PREMIER_LEAGUE_CLUBS.find((c) => c.name === normalizedClub);
};

// Convert a #RRGGBB hex to "H S% L%" string for CSS HSL variables.
export const hexToHslString = (hex: string): string => {
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
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const relLuminance = (hex: string): number => {
  const h = hex.replace("#", "");
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLin(parseInt(h.slice(0, 2), 16));
  const g = toLin(parseInt(h.slice(2, 4), 16));
  const b = toLin(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const readableForegroundHsl = (hex: string): string =>
  relLuminance(hex) > 0.5 ? "220 13% 8%" : "0 0% 98%";