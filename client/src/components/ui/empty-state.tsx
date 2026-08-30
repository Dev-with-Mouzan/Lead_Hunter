import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col items-center justify-center py-20 px-4 text-center', className)} {...props}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center text-primary mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-heading font-semibold text-card-foreground mb-1.5">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  ),
)
EmptyState.displayName = 'EmptyState'
