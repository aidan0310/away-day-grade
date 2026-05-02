import { cn } from "@/lib/utils";

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-sm",
  md: "h-10 w-10 text-lg",
  lg: "h-16 w-16 text-2xl",
};

export const Avatar = ({ url, name, size = "md", className }: AvatarProps) => {
  const initials = name?.[0]?.toUpperCase() ?? "?";

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? "User"}
        className={cn(
          "rounded-xl object-cover shrink-0",
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-display shrink-0",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
};