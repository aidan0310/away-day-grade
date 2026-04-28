import { cn } from "@/lib/utils";

export const gradeColor = (g: number) => {
  if (g >= 7.5) return "bg-rating-good text-primary-foreground";
  if (g >= 5) return "bg-rating-mid text-primary-foreground";
  return "bg-rating-bad text-destructive-foreground";
};

export const gradeLabel = (g: number) => {
  if (g >= 9) return "S";
  if (g >= 7.5) return "A";
  if (g >= 6) return "B";
  if (g >= 4.5) return "C";
  if (g >= 3) return "D";
  return "F";
};

export const GradePill = ({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-lg",
    lg: "h-20 w-20 text-3xl",
  };
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-2xl font-extrabold leading-none",
      sizes[size],
      gradeColor(value),
    )}>
      <span>{value.toFixed(1)}</span>
    </div>
  );
};

export const LetterGrade = ({ value, size = "lg" }: { value: number; size?: "md" | "lg" }) => {
  const sizes = { md: "h-14 w-14 text-2xl", lg: "h-24 w-24 text-5xl" };
  return (
    <div className={cn(
      "flex items-center justify-center rounded-2xl font-display tracking-wider",
      sizes[size],
      gradeColor(value),
    )}>
      {gradeLabel(value)}
    </div>
  );
};
