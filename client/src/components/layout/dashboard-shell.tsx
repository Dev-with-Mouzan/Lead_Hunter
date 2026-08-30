import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem, SidebarLabel } from '../ui/sidebar'
import {
  LayoutDashboard,
  Search,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
} from 'lucide-react'

const navItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'search', label: 'Find Leads', icon: Search, path: '/search' },
  { id: 'history', label: 'History', icon: Clock, path: '/history' },
]

const settingsItems = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

export function DashboardShell({ children, currentPath }: { children: React.ReactNode; currentPath: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed}>
        <SidebarHeader>
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="LeadHunter" className="h-10 w-auto shrink-0" />
            {!collapsed && (
              <div className="animate-fade-in">
                <span className="font-heading font-bold text-white text-lg tracking-tight">LeadHunter</span>
                <span className="text-[10px] text-sidebar-foreground/50 block -mt-0.5 font-medium">Lead Finder</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarLabel>Navigation</SidebarLabel>
          {navItems.map(item => (
            <SidebarItem
              key={item.id}
              active={currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path))}
              icon={<item.icon className="w-[18px] h-[18px]" />}
              onClick={() => navigate({ to: item.path })}
            >
              {!collapsed && item.label}
            </SidebarItem>
          ))}

          <SidebarLabel>System</SidebarLabel>
          {settingsItems.map(item => (
            <SidebarItem
              key={item.id}
              active={currentPath === item.path}
              icon={<item.icon className="w-[18px] h-[18px]" />}
              onClick={() => navigate({ to: item.path })}
            >
              {!collapsed && item.label}
            </SidebarItem>
          ))}
        </SidebarContent>

        <SidebarFooter>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                LH
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">LeadHunter App</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">v1.0.0</p>
              </div>
              <button className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-hover transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                O
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border h-16 flex items-center px-6 gap-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">System Online</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
