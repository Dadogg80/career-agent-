import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-normal break-words rounded-lg text-center text-sm font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:bg-[#858b86] disabled:text-white disabled:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:bg-[#9b7270] disabled:text-white disabled:shadow-none",
        outline:
          "border border-input bg-background shadow-none hover:bg-accent hover:text-accent-foreground disabled:border-[#deded8] disabled:bg-[#f2f1ee] disabled:text-[#6b6e69] disabled:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground shadow-none hover:bg-secondary/80 disabled:bg-[#e8e7e2] disabled:text-[#5f635e] disabled:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground disabled:text-[#686d67]",
        link: "text-primary underline-offset-4 hover:underline disabled:text-[#686d67]",
      },
      size: {
        default: "min-h-11 h-auto px-4 py-2.5",
        sm: "min-h-10 h-auto px-3 py-2 text-xs",
        lg: "min-h-12 h-auto px-6 py-3 text-base",
        icon: "h-11 w-11 min-w-11",
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
