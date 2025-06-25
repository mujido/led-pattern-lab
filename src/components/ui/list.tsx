import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const listVariants = cva(
  "space-y-2",
  {
    variants: {
      variant: {
        default: "",
        compact: "space-y-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const listItemVariants = cva(
  "p-4 rounded-lg border transition-all",
  {
    variants: {
      variant: {
        default: "border-gray-600 bg-gray-700/50 hover:bg-gray-700",
        selected: "border-blue-500 bg-blue-900/20",
        interactive: "border-gray-600 bg-gray-700/50 hover:bg-gray-700 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {}

export interface ListItemProps
  extends React.HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {}

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, variant, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn(listVariants({ variant }), className)}
      {...props}
    />
  )
)
List.displayName = "List"

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, variant, ...props }, ref) => (
    <li
      ref={ref}
      className={cn(listItemVariants({ variant }), className)}
      {...props}
    />
  )
)
ListItem.displayName = "ListItem"

export { List, ListItem, listVariants, listItemVariants }
