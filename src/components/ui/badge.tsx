import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantic variants para consistência com Design System
        success: "border-success/25 bg-success/15 text-success hover:bg-success/25",
        warning: "border-warning/25 bg-warning/15 text-warning hover:bg-warning/25",
        info: "border-info/25 bg-info/15 text-info hover:bg-info/25",
        // Status variants com estilo glass
        processing: "border-warning/25 bg-warning/15 text-warning",
        completed: "border-success/25 bg-success/15 text-success",
        cancelled: "border-destructive/25 bg-destructive/15 text-destructive",
        pending: "border-info/25 bg-info/15 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
