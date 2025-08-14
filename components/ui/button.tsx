import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white hover:bg-zinc-800 [box-shadow:inset_0px_-2px_0px_0px_#18181b,_0px_1px_6px_0px_rgba(24,_24,_27,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#18181b,_0px_1px_3px_0px_rgba(24,_24,_27,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#18181b,_0px_1px_2px_0px_rgba(24,_24,_27,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 [box-shadow:inset_0px_-2px_0px_0px_#d4d4d8,_0px_1px_6px_0px_rgba(161,_161,_170,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#d4d4d8,_0px_1px_3px_0px_rgba(161,_161,_170,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#d4d4d8,_0px_1px_2px_0px_rgba(161,_161,_170,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
        outline: "border border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-900 [box-shadow:inset_0px_-2px_0px_0px_#e4e4e7,_0px_1px_6px_0px_rgba(228,_228,_231,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#e4e4e7,_0px_1px_3px_0px_rgba(228,_228,_231,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#e4e4e7,_0px_1px_2px_0px_rgba(228,_228,_231,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
        destructive: "bg-red-500 text-white hover:bg-red-600 [box-shadow:inset_0px_-2px_0px_0px_#dc2626,_0px_1px_6px_0px_rgba(239,_68,_68,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#dc2626,_0px_1px_3px_0px_rgba(239,_68,_68,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#dc2626,_0px_1px_2px_0px_rgba(239,_68,_68,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
        code: "bg-[#36322F] text-white hover:bg-[#4a4542] [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#171310,_0px_1px_3px_0px_rgba(58,_33,_8,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#171310,_0px_1px_2px_0px_rgba(58,_33,_8,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
        orange: "bg-orange-500 text-white hover:bg-orange-600 [box-shadow:inset_0px_-2px_0px_0px_#c2410c,_0px_1px_6px_0px_rgba(234,_88,_12,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#c2410c,_0px_1px_3px_0px_rgba(234,_88,_12,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#c2410c,_0px_1px_2px_0px_rgba(234,_88,_12,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1 text-sm",
        icon: "h-8 w-8 p-0",
        lg: "h-12 px-6 py-3",
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
    const Comp = asChild ? "button" : "button"
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