import * as React from "react"
import { cn } from "@/lib/utils"

export interface ListProps
  extends React.HTMLAttributes<HTMLUListElement> {}

export interface ListItemProps
  extends React.HTMLAttributes<HTMLLIElement> {}

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    />
  )
)
List.displayName = "List"

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("p-4 rounded-lg border border-gray-600 bg-gray-700/50 hover:bg-gray-700 transition-all", className)}
      {...props}
    />
  )
)
ListItem.displayName = "ListItem"

export { List, ListItem }
