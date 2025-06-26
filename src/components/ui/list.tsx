import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const listVariants = cva("space-y-2", {
  variants: {
    variant: {
      default: "",
      sublevel: "ml-4 space-y-1",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const listItemVariants = cva(
  "p-4 rounded-lg border transition-all",
  {
    variants: {
      variant: {
        default: "border-border bg-muted hover:bg-accent",
        sublevel: "border-border/50 bg-background/50 hover:bg-muted/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {}

interface ListItemProps
  extends React.HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {}

export function List({ className, variant, ...props }: ListProps) {
  return (
    <ul className={cn(listVariants({ variant }), className)} {...props} />
  )
}

export function ListItem({ className, variant, ...props }: ListItemProps) {
  return (
    <li className={cn(listItemVariants({ variant }), className)} {...props} />
  )
}
