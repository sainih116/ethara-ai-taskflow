import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderOpen, CheckCircle2, AlertCircle, BarChart3,
  TrendingUp, Activity, ArrowUpRight, Plus, ArrowRight,
  Clock, Users,
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dashboardAPI } from '@/api/dashboard'
import { formatRelative } from '@/utils/formatters'
import useAuthStore from '@/store/authStore'

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#f59e0b',
  low:    '#10b981',
}

/* ── Skeleton ───────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="shimmer h-3 w-24 rounded" />
        <div className="shimmer h-8 w-16 rounded" />
        <div className="shimmer h-2.5 w-20 rounded" />
      </CardContent>
    </Card>
  )
}

/* ── Stat card ──────────────────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, iconBg, iconColor, sub, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
    >
      <Card className="stat-card-accent hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <p className="text-3xl font-bold mt-1.5 tabular-nums">{value ?? 0}</p>
              {sub && (
                <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
              )}
            </div>
            <div className={`p-2.5 rounded-lg ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ── Empty onboarding state ─────────────────────────────────────────── */
function EmptyState({ isAdmin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-7 w-7 text-indigo-600" />
          </div>
          <h3 className="text-base font-semibold mb-2">
            {isAdmin ? 'Welcome to Ethara AI TaskFlow' : 'No tasks assigned yet'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            {isAdmin
              ? 'Your workspace is ready. Start by creating a project, then add tasks and assign them to your team.'
              : 'Your admin will assign tasks to you. Check back here once projects are set up.'}
          </p>
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/projects">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  <Plus className="h-4 w-4" /> Create First Project
                </Button>
              </Link>
              <Link to="/team">
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" /> View Team Members
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ── Custom chart tooltip ───────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    dashboardAPI.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const isEmpty = !loading && (stats?.totalTasks ?? 0) === 0 && (stats?.totalProjects ?? 0) === 0

  const trendData = stats?.completionTrend?.length
    ? stats.completionTrend.map((d) => ({ date: d._id, completed: d.count }))
    : Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000)
          .toLocaleDateString('en', { weekday: 'short' }),
        completed: 0,
      }))

  const priorityData = (stats?.tasksByPriority || []).map((d) => ({
    name:  d._id,
    value: d.count,
    color: PRIORITY_COLORS[d._id] || '#6366f1',
  }))

  const completionRate = stats?.completionRate?.toFixed(1) ?? 0

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {greeting()}, {user?.name?.split(' ')[0]}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isEmpty
                ? 'Your workspace is ready — let\'s get started.'
                : 'Here\'s your workspace overview for today.'}
            </p>
          </div>
          {isAdmin && !isEmpty && (
            <Link to="/projects">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="h-3.5 w-3.5" /> New Project
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Empty onboarding */}
      {isEmpty && <EmptyState isAdmin={isAdmin} />}

      {/* KPI cards — always show once loaded */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard index={0} title="Total Projects"  value={stats?.totalProjects}  icon={FolderOpen}   iconBg="bg-indigo-50 dark:bg-indigo-950/40"   iconColor="text-indigo-600"  sub={isAdmin ? 'All departments' : 'Assigned to you'} />
          <StatCard index={1} title="Total Tasks"     value={stats?.totalTasks}     icon={BarChart3}    iconBg="bg-blue-50 dark:bg-blue-950/40"       iconColor="text-blue-600"    sub="Across all projects" />
          <StatCard index={2} title="Completed"       value={stats?.completedTasks} icon={CheckCircle2} iconBg="bg-emerald-50 dark:bg-emerald-950/40" iconColor="text-emerald-600" sub={`${completionRate}% completion rate`} />
          <StatCard index={3} title="Overdue"         value={stats?.overdueTasks}   icon={AlertCircle}  iconBg="bg-red-50 dark:bg-red-950/40"         iconColor="text-red-600"     sub={stats?.overdueTasks > 0 ? 'Needs attention' : 'All on track'} />
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Charts — only show when there's data */}
      {!loading && !isEmpty && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Trend chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    Task Completion — Last 7 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="#4f46e5" strokeWidth={2} fill="url(#areaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Priority pie */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Tasks by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  {priorityData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={priorityData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                            {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2">
                        {priorityData.map((d) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                              <span className="capitalize text-muted-foreground">{d.name}</span>
                            </div>
                            <span className="font-semibold tabular-nums">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">No priority data yet</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Progress + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Productivity Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Completion Rate', value: completionRate, color: 'bg-emerald-500' },
                    { label: 'In Progress',     value: stats?.totalTasks ? ((stats.inProgressTasks / stats.totalTasks) * 100).toFixed(1) : 0, color: 'bg-blue-500' },
                    { label: 'Overdue Rate',    value: stats?.totalTasks ? ((stats.overdueTasks / stats.totalTasks) * 100).toFixed(1) : 0, color: 'bg-red-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground font-medium">{label}</span>
                        <span className="font-semibold tabular-nums">{value}%</span>
                      </div>
                      <Progress value={Number(value)} className="h-1.5" indicatorClassName={color} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.recentActivity?.length ? (
                    <div className="space-y-3">
                      {stats.recentActivity.slice(0, 6).map((log) => (
                        <div key={log._id} className="flex items-start gap-3">
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={log.userAvatar} />
                            <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">{log.userName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-snug">
                              <span className="font-medium">{log.userName}</span>{' '}
                              <span className="text-muted-foreground">{log.action}</span>{' '}
                              <span className="font-medium">{log.entityName}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(log.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">
                      No activity yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      {/* Admin quick-actions when data exists */}
      {!loading && !isEmpty && isAdmin && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'New Project', to: '/projects', icon: FolderOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
                  { label: 'New Task',    to: '/tasks',    icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
                  { label: 'Kanban Board',to: '/kanban',   icon: BarChart3,   color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
                  { label: 'Team Members',to: '/team',     icon: Users,       color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
                ].map(({ label, to, icon: Icon, color }) => (
                  <Link key={to} to={to}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-indigo-300 hover:bg-accent transition-all duration-150 cursor-pointer group">
                      <div className={`p-2 rounded-md ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
