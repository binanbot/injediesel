import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-injediesel.svg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <img 
      src={logoImage} 
      alt="Injediesel PowerChip" 
      className={cn(sizeClasses[size], "w-auto", className)}
    />
  );
}
