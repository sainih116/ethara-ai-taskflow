import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Calendar, AlertCircle, CheckCircle2,
  Clock, Eye, Trash2, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import useTaskStore from '@/store/taskStore'
import useProjectStore from '@/store/projectStore'
import useAuthStore from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { TASK_STATUSES } from '@/utils/constants'
import { usersAPI } from '@/api/users'
import { useForm } from 'react-hook-form'

/* ── Helpers ────────────────────────────────────────────────────────── */
const priorityStyle = {
  urgent: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50',
  high:   'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50',
  medium: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50',
  low:    'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50',
}

const statusStyle = {
  todo:          'text-slate-600 bg-slate-100 dark:bg-slate-800/60',
  'in-progress': 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  'in-review':   'text-violet-600 bg-violet-50 dark:bg-violet-950/30',
  done:          'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
}

function CircleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

const statusIcons = {
  todo:          CircleIcon,
  'in-progress': Clock,
  'in-review':   Eye,
  done:          CheckCircle2,
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function TasksPage() {
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, isLoading, setFilters, filters } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [search, setSearch]       = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [allUsers, setAllUsers]   = useState([])
  const [creating, setCreating]   = useState(false)
  const [priorityFilter, setPriorityFilter] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchTasks({ limit: 200 })
    fetchProjects({ limit: 50 })
    if (isAdmin) usersAPI.getAll({ limit: 100 }).then(({ data }) => setAllUsers(data.data || []))
  }, [])

  /* Client-side filtering */
  const filtered = tasks.filter((t) => {
    const matchSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
    const matchStatus   = !filters.status   || t.status   === filters.status
    const matchPriority = !priorityFilter   || t.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  const onCreateTask = async (data) => {
    setCreating(true)
    const result = await createTask(data)
    setCreating(false)
    if (result.success) {
      toast({ title: 'Task created', variant: 'success' })
      setShowCreate(false)
      reset()
      fetchTasks({ limit: 200 })
    } else {
      toast({ title: 'Failed to create task', description: result.error, variant: 'destructive' })
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    const result = await updateTask(taskId, { status: newStatus })
    if (!result.success) toast({ title: 'Failed to update status', variant: 'destructive' })
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return
    const result = await deleteTask(taskId)
    if (result.success) toast({ title: 'Task deleted', variant: 'success' })
  }

  /* Summary counts for admin */
  const summary = {
    total:      tasks.length,
    todo:       tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done:       tasks.filter((t) => t.status === 'done').length,
    overdue:    tasks.filter((t) => t.isOverdue).length,
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {isAdmin ? 'All Tasks' : 'My Tasks'}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} of {tasks.length} tasks
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" /> New Task
          </Button>
        )}
      </div>

      {/* Admin summary strip */}
      {isAdmin && tasks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total',       value: summary.total,      color: 'text-foreground' },
            { label: 'To Do',       value: summary.todo,       color: 'text-slate-600' },
            { label: 'In Progress', value: summary.inProgress, color: 'text-blue-600' },
            { label: 'Done',        value: summary.done,       color: 'text-emerald-600' },
            { label: 'Overdue',     value: summary.overdue,    color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Status filter */}
          {['', 'todo', 'in-progress', 'in-review', 'done'].map((s) => (
            <Button
              key={s}
              variant={filters.status === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setFilters({ status: s }); fetchTasks({ status: s, limit: 200 }) }}
              className={`capitalize text-xs ${filters.status === s ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : ''}`}
            >
              {s ? TASK_STATUSES[s]?.label : 'All Status'}
            </Button>
          ))}
        </div>
        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-base font-semibold">No tasks found</p>
          <p className="text-sm mt-1">
            {isAdmin ? 'Create your first task to get started.' : 'No tasks have been assigned to you yet.'}
          </p>
          {isAdmin && (
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((task, i) => {
              const StatusIcon = statusIcons[task.status] || CircleIcon
              const canEdit = isAdmin || task.assignedTo?._id === user?._id
              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ delay: i * 0.025 }}
                >
                  <Card className={`hover:shadow-sm transition-all ${task.isOverdue ? 'border-red-300 dark:border-red-900/60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Status icon */}
                        <StatusIcon
                          className={`h-4 w-4 shrink-0 ${task.status === 'done' ? 'text-emerald-500' : 'text-muted-foreground'}`}
                        />

                        {/* Title + project */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {task.projectName && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.projectName}</p>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          {/* Priority */}
                          <Badge variant="outline" className={`text-xs ${priorityStyle[task.priority]}`}>
                            {task.priority}
                          </Badge>

                          {/* Status selector */}
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            disabled={!canEdit}
                            className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                          >
                            {Object.entries(TASK_STATUSES).map(([v, { label }]) => (
                              <option key={v} value={v}>{label}</option>
                            ))}
                          </select>

                          {/* Due date */}
                          {task.dueDate && (
                            <span className={`text-xs flex items-center gap-1 ${task.isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              {task.isOverdue && <AlertCircle className="h-3 w-3" />}
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </span>
                          )}

                          {/* Assignee */}
                          {task.assignedTo && (
                            <Avatar className="h-6 w-6" title={task.assignedTo.name}>
                              <AvatarImage src={task.assignedTo.avatar} />
                              <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                {task.assignedTo.name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          {/* Delete */}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(task._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateTask)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                {...register('title', { required: 'Title is required' })}
                placeholder="Task title"
                className="mt-1"
              />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                {...register('description')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Task details…"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Project *</label>
              <select
                {...register('projectId', { required: 'Project is required' })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
              {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  {...register('priority')}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input {...register('dueDate')} type="date" className="mt-1" />
              </div>
            </div>
            {allUsers.length > 0 && (
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <select
                  {...register('assignedTo')}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {allUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
