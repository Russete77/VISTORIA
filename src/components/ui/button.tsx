import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:bg-neutral-300 disabled:text-neutral-500 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:bg-primary-800 active:scale-98",
        destructive:
          "bg-danger-600 text-white shadow-sm hover:bg-danger-700 hover:shadow-md active:bg-danger-800 active:scale-98 focus-visible:ring-danger-200",
        outline:
          "border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-100 hover:border-neutral-400 active:bg-neutral-200 focus-visible:border-primary-500",
        secondary:
          "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300",
        ghost:
          "bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200",
        link:
          "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm [&_svg]:size-4",
        lg: "h-14 px-8 py-4 text-lg [&_svg]:size-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
