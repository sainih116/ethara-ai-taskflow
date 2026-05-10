import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderOpen, CheckSquare, Users, BarChart3,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Kanban, UserCircle, Building2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import useAuthStore from '@/store/authStore'
import useUIStore from '@/store/uiStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/utils/formatters'

/* ── Navigation config ──────────────────────────────────────────────── */
const mainNav = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',     icon: FolderOpen,      label: 'Projects' },
  { to: '/tasks',        icon: CheckSquare,     label: 'My Tasks' },
  { to: '/kanban',       icon: Kanban,          label: 'Kanban Board' },
  { to: '/analytics',   icon: BarChart3,       label: 'Analytics' },
  { to: '/notifications',icon: Bell,            label: 'Notifications' },
]

const adminNav = [
  { to: '/team', icon: Users, label: 'Team Members' },
]

const bottomNav = [
  { to: '/profile',  icon: UserCircle, label: 'My Profile' },
  { to: '/settings', icon: Settings,   label: 'Settings' },
]

/* ── Component ──────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
  const isAdmin = user?.role === 'admin'

  const allMain = isAdmin ? [...mainNav, ...adminNav] : mainNav

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full sidebar-enterprise border-r border-white/5 overflow-hidden select-none"
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center h-14 px-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon mark */}
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="min-w-0"
              >
                <p className="text-white font-semibold text-sm leading-tight whitespace-nowrap">
                  Ethara AI
                </p>
                <p className="text-white/40 text-[10px] leading-tight whitespace-nowrap">
                  TaskFlow
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main navigation ──────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Section label */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-white/25"
            >
              Workspace
            </motion.p>
          )}
        </AnimatePresence>

        {allMain.map((item) => (
          <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
        ))}

        {/* Bottom section */}
        <div className="pt-3 mt-3 border-t border-white/5">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25"
              >
                Account
              </motion.p>
            )}
          </AnimatePresence>
          {bottomNav.map((item) => (
            <NavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>
      </nav>

      {/* ── User footer ──────────────────────────────────────────────── */}
      <div className="border-t border-white/5 p-3 shrink-0">
        <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
          <Avatar className="h-7 w-7 shrink-0 ring-1 ring-white/10">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-[10px] bg-indigo-700 text-white">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white/90 text-xs font-medium truncate leading-tight">
                  {user?.name}
                </p>
                <p className="text-white/35 text-[10px] capitalize leading-tight">
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Collapse toggle ───────────────────────────────────────────── */}
      <button
        onClick={toggleSidebarCollapsed}
        className="absolute -right-3 top-[72px] z-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors"
      >
        {sidebarCollapsed
          ? <ChevronRight className="h-3 w-3 text-muted-foreground" />
          : <ChevronLeft  className="h-3 w-3 text-muted-foreground" />
        }
      </button>
    </motion.aside>
  )
}

/* ── Single nav item ────────────────────────────────────────────────── */
function NavItem({ item, collapsed }) {
  const location = useLocation()
  const isActive = location.pathname === item.to ||
    (item.to !== '/dashboard' && location.pathname.startsWith(item.to))

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 group relative',
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-white/50 hover:text-white/90 hover:bg-white/5',
        collapsed && 'justify-center px-2'
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70')} />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  )
}
