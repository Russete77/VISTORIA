import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-neutral-500 hover:border-neutral-400 focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500 disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
