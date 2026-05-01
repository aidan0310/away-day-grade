import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const getSeason = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  // Football season runs Aug-May, so Aug 2024 = 2024/25
  if (month >= 8) {
    return `${year}/${String(year + 1).slice(2)}`;
  } else {
    return `${year - 1}/${String(year).slice(2)}`;
  }
};

export const getAllSeasons = (dates: string[]): string[] => {
  const seasons = [...new Set(dates.map(getSeason))];
  return seasons.sort((a, b) => b.localeCompare(a)); // newest first
};