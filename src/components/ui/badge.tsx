import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-100 text-neutral-700 border border-neutral-200",
        primary:
          "bg-primary-100 text-primary-700 border border-primary-200",
        success:
          "bg-success-100 text-success-700 border border-success-200",
        warning:
          "bg-warning-100 text-warning-700 border border-warning-200",
        danger:
          "bg-danger-100 text-danger-700 border border-danger-200",
        info:
          "bg-info-100 text-info-700 border border-info-200",
        outline:
          "bg-transparent text-neutral-700 border border-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
