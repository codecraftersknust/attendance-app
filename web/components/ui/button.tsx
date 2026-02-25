import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-emerald-900 text-white hover:bg-emerald-800 active:bg-emerald-700",
        primary: "bg-emerald-900 text-white hover:bg-emerald-800 active:bg-emerald-700",
        accent: "bg-amber-600 text-white hover:bg-amber-500 active:bg-amber-700",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/95 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-gray-300 bg-background shadow-xs hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:active:bg-input/60",
        "outline-accent":
          "border-2 border-amber-500 text-amber-700 bg-transparent hover:bg-amber-50 hover:border-amber-600 active:bg-amber-100 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/50 dark:active:bg-amber-950/70",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost:
          "hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-accent/50 dark:active:bg-accent/70",
        link: "text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline active:text-emerald-900",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
