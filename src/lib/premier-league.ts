// Premier League 2025/26 season clubs and their home stadiums.
// Used to enforce consistent naming across reviews.
export type PLClub = {
  name: string;
  stadium: string;
};

export const PREMIER_LEAGUE_CLUBS: PLClub[] = [
  { name: "Arsenal", stadium: "Emirates Stadium" },
  { name: "Aston Villa", stadium: "Villa Park" },
  { name: "Bournemouth", stadium: "Vitality Stadium" },
  { name: "Brentford", stadium: "Gtech Community Stadium" },
  { name: "Brighton & Hove Albion", stadium: "Amex Stadium" },
  { name: "Burnley", stadium: "Turf Moor" },
  { name: "Chelsea", stadium: "Stamford Bridge" },
  { name: "Crystal Palace", stadium: "Selhurst Park" },
  { name: "Everton", stadium: "Hill Dickinson Stadium" },
  { name: "Fulham", stadium: "Craven Cottage" },
  { name: "Leeds United", stadium: "Elland Road" },
  { name: "Liverpool", stadium: "Anfield" },
  { name: "Manchester City", stadium: "Etihad Stadium" },
  { name: "Manchester United", stadium: "Old Trafford" },
  { name: "Newcastle United", stadium: "St James' Park" },
  { name: "Nottingham Forest", stadium: "City Ground" },
  { name: "Sunderland", stadium: "Stadium of Light" },
  { name: "Tottenham Hotspur", stadium: "Tottenham Hotspur Stadium" },
  { name: "West Ham United", stadium: "London Stadium" },
  { name: "Wolverhampton Wanderers", stadium: "Molineux Stadium" },
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
