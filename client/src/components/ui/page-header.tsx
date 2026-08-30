import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, action, className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)} {...props}>
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  ),
)
PageHeader.displayName = 'PageHeader'
