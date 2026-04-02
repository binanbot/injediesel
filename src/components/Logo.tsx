import { cn } from "@/lib/utils";
import { useCompany } from "@/hooks/useCompany";
import logoFallback from "@/assets/logo-injediesel.svg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const { company } = useCompany();

  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  const logoUrl = company?.branding?.logo_url || logoFallback;
  const altText = company?.brand_name || company?.name || "Logo";

  return (
    <img 
      src={logoUrl} 
      alt={altText} 
      className={cn(sizeClasses[size], "w-auto", className)}
    />
  );
}
