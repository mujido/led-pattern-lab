import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const pageLayoutVariants = cva(
  "min-h-screen bg-background text-foreground p-4",
  {
    variants: {
      variant: {
        default: "",
        centered: "flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface PageLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageLayoutVariants> {}

export function PageLayout({ className, variant, children, ...props }: PageLayoutProps) {
  return (
    <div className={cn(pageLayoutVariants({ variant }), className)} {...props}>
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}
