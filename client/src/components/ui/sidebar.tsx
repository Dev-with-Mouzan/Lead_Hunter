import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface SidebarProps extends HTMLAttributes<HTMLElement> {
  collapsed?: boolean
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, collapsed, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen sticky top-0 z-40',
        collapsed ? 'w-[68px]' : 'w-[260px]',
        'transition-all duration-300',
        className
      )}
      {...props}
    />
  ),
)
Sidebar.displayName = 'Sidebar'

export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 px-5 h-16 shrink-0', className)} {...props} />
  ),
)
SidebarHeader.displayName = 'SidebarHeader'

export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto px-3 py-2 space-y-1', className)} {...props} />
  ),
)
SidebarContent.displayName = 'SidebarContent'

export const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('shrink-0 border-t border-sidebar-border px-3 py-3', className)} {...props} />
  ),
)
SidebarFooter.displayName = 'SidebarFooter'

export const SidebarItem = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement> & { active?: boolean; icon?: React.ReactNode }>(
  ({ active, icon, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        active
          ? 'bg-sidebar-active text-white shadow-lg shadow-sidebar-active/20'
          : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
        className
      )}
      {...props}
    >
      {icon && <span className="w-5 h-5 shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  ),
)
SidebarItem.displayName = 'SidebarItem'

export const SidebarLabel = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/50', className)} {...props} />
  ),
)
SidebarLabel.displayName = 'SidebarLabel'
