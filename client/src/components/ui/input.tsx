import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="text-xs font-medium text-muted-foreground tracking-wide">{label}</label>}
      <input
        id={id}
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-card-foreground placeholder:text-muted-foreground/60',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
