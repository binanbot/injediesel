import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <span className={cn(
          "font-bold tracking-tight",
          sizeClasses[size]
        )}>
          <span className="text-primary">Inje</span>
          <span className="text-foreground">diesel</span>
        </span>
        <span className="absolute -bottom-0.5 left-0 text-[8px] text-muted-foreground tracking-wider uppercase">
          PowerChip
        </span>
      </div>
    </div>
  );
}
