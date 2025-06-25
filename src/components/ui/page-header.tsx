import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLElement> {
  title: string
  description?: string
  showUnsavedIndicator?: boolean
  backButton?: {
    label?: string
    onClick: () => void
  }
  actionButton?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    variant?: "default" | "secondary" | "destructive"
  }
  actions?: React.ReactNode
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({
    className,
    title,
    description,
    showUnsavedIndicator = false,
    backButton,
    actionButton,
    actions,
    children,
    ...props
  }, ref) => (
    <header
      ref={ref}
      className={cn("text-center mb-8", className)}
      {...props}
    >
      {/* Navigation and Action Buttons */}
      {(backButton || actionButton) && (
        <div className="flex items-center justify-between mb-4">
          {backButton ? (
            <Button
              onClick={backButton.onClick}
              variant="outline"
              className="border-blue-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backButton.label || "Back"}
            </Button>
          ) : (
            <div></div>
          )}

          {actionButton && (
            <Button
              onClick={actionButton.onClick}
              variant={actionButton.variant || "default"}
            >
              {actionButton.icon}
              {actionButton.label}
            </Button>
          )}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        {title}
        {showUnsavedIndicator && (
          <span className="text-yellow-300 ml-2">*</span>
        )}
      </h1>

      {/* Description */}
      {description && (
        <p className="text-gray-400">{description}</p>
      )}

      {/* Actions */}
      {actions && (
        <div className="mt-4">
          {actions}
        </div>
      )}

      {/* Additional Content */}
      {children}
    </header>
  )
)
PageHeader.displayName = "PageHeader"

export { PageHeader }
