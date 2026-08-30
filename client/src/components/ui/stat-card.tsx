import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  icon?: React.ReactNode
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, change, changeType = 'neutral', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-heading font-bold text-card-foreground">{value}</p>
          {change && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md',
              changeType === 'up' && 'text-emerald-600 bg-emerald-50',
              changeType === 'down' && 'text-red-500 bg-red-50',
              changeType === 'neutral' && 'text-muted-foreground bg-muted'
            )}>
              {change}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            {icon}
          </div>
        )}
      </div>
    </div>
  ),
)
StatCard.displayName = 'StatCard'
