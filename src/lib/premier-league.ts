// Premier League 2025/26 season clubs and their home stadiums.
// Used to enforce consistent naming across reviews.
export type PLClub = {
  name: string;
  stadium: string;
  /** Brand primary in hex (e.g. #EF0107). */
  primaryHex: string;
  /** Brand secondary in hex. */
  secondaryHex: string;
};

export const PREMIER_LEAGUE_CLUBS: PLClub[] = [
  { name: "Arsenal", stadium: "Emirates Stadium", primaryHex: "#EF0107", secondaryHex: "#FFFFFF" },
  { name: "Aston Villa", stadium: "Villa Park", primaryHex: "#95BFE5", secondaryHex: "#670E36" },
  { name: "Bournemouth", stadium: "Vitality Stadium", primaryHex: "#DA291C", secondaryHex: "#000000" },
  { name: "Brentford", stadium: "Gtech Community Stadium", primaryHex: "#E30613", secondaryHex: "#FFFFFF" },
  { name: "Brighton & Hove Albion", stadium: "Amex Stadium", primaryHex: "#0057B8", secondaryHex: "#FFCD00" },
  { name: "Burnley", stadium: "Turf Moor", primaryHex: "#6C1D45", secondaryHex: "#99D6EA" },
  { name: "Chelsea", stadium: "Stamford Bridge", primaryHex: "#034694", secondaryHex: "#DBA111" },
  { name: "Crystal Palace", stadium: "Selhurst Park", primaryHex: "#1B458F", secondaryHex: "#C4122E" },
  { name: "Everton", stadium: "Hill Dickinson Stadium", primaryHex: "#003399", secondaryHex: "#FFFFFF" },
  { name: "Fulham", stadium: "Craven Cottage", primaryHex: "#FFFFFF", secondaryHex: "#000000" },
  { name: "Leeds United", stadium: "Elland Road", primaryHex: "#FFCD00", secondaryHex: "#1D428A" },
  { name: "Liverpool", stadium: "Anfield", primaryHex: "#C8102E", secondaryHex: "#F6EB61" },
  { name: "Manchester City", stadium: "Etihad Stadium", primaryHex: "#6CABDD", secondaryHex: "#1C2C5B" },
  { name: "Manchester United", stadium: "Old Trafford", primaryHex: "#DA291C", secondaryHex: "#FBE122" },
  { name: "Newcastle United", stadium: "St James' Park", primaryHex: "#241F20", secondaryHex: "#BBBCBC" },
  { name: "Nottingham Forest", stadium: "City Ground", primaryHex: "#DD0000", secondaryHex: "#FFFFFF" },
  { name: "Sunderland", stadium: "Stadium of Light", primaryHex: "#FF0000", secondaryHex: "#FFFFFF" },
  { name: "Tottenham Hotspur", stadium: "Tottenham Hotspur Stadium", primaryHex: "#132257", secondaryHex: "#FFFFFF" },
  { name: "West Ham United", stadium: "London Stadium", primaryHex: "#7A263A", secondaryHex: "#1BB1E7" },
  { name: "Wolverhampton Wanderers", stadium: "Molineux Stadium", primaryHex: "#FDB913", secondaryHex: "#231F20" },
];

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
};

export const normalizeClubName = (club: string): string => {
  const key = club.trim().toLowerCase();
  return CLUB_ALIASES[key] ?? club.trim();
};

export const stadiumForClub = (club: string): string | undefined => {
  const normalizedClub = normalizeClubName(club);
  return PREMIER_LEAGUE_CLUBS.find((c) => c.name === normalizedClub)?.stadium;
};
