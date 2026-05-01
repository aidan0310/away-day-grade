export type Rank = {
  label: string;
  minMatches: number;
  color: string;
};

export const RANKS: Rank[] = [
  { label: "Casual",    minMatches: 0,   color: "text-muted-foreground" },
  { label: "Regular",   minMatches: 10,  color: "text-blue-400" },
  { label: "Die Hard",  minMatches: 25,  color: "text-orange-400" },
  { label: "Ultras",    minMatches: 50,  color: "text-purple-400" },
  { label: "Legend",    minMatches: 100, color: "text-primary" },
];

export const getRank = (matchCount: number): Rank => {
  return [...RANKS].reverse().find((r) => matchCount >= r.minMatches) ?? RANKS[0];
};

export const getNextRank = (matchCount: number): { rank: Rank; matchesNeeded: number } | null => {
  const next = RANKS.find((r) => r.minMatches > matchCount);
  if (!next) return null;
  return { rank: next, matchesNeeded: next.minMatches - matchCount };
};