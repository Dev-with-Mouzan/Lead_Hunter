import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const variants = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success-subtle text-emerald-600 border border-emerald-200',
  warning: 'bg-warning-subtle text-amber-600 border border-amber-200',
  danger: 'bg-destructive-subtle text-red-500 border border-red-200',
  info: 'bg-primary-subtle text-primary border border-primary/20',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <span ref={ref} className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full', variants[variant], className)} {...props} />
  ),
)
Badge.displayName = 'Badge'
