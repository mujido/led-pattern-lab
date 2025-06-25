import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("min-h-screen bg-gray-900 text-white p-4", className)}
      {...props}
    >
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
)
PageLayout.displayName = "PageLayout"

export { PageLayout }
