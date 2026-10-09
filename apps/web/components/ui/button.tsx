import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-normal break-words rounded-md text-center text-sm font-medium leading-snug transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:bg-[#789083] disabled:text-white disabled:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:bg-[#9b7270] disabled:text-white disabled:shadow-none",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground disabled:border-[#d7ded7] disabled:bg-[#f1f4ef] disabled:text-[#53645a] disabled:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 disabled:bg-[#e5eae5] disabled:text-[#4f6257] disabled:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground disabled:text-[#69786f]",
        link: "text-primary underline-offset-4 hover:underline disabled:text-[#68776f]",
      },
      size: {
        default: "min-h-9 h-auto px-4 py-2",
        sm: "min-h-8 h-auto rounded-md px-3 py-2 text-xs",
        lg: "min-h-10 h-auto px-8 py-2",
        icon: "h-9 w-9 min-w-9",
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
