import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, AlertCircle, ChevronDown, Plus, ListTodo } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useTaskStore from '@/store/taskStore'
import useProjectStore from '@/store/projectStore'
import useAuthStore from '@/store/authStore'
import { usersAPI } from '@/api/users'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { KANBAN_COLUMNS, TASK_PRIORITIES } from '@/utils/constants'

const taskSchema = z.object({
  title:       z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  priority:    z.string().optional(),
  status:      z.string().optional(),
  dueDate:     z.string().optional(),
  projectId:   z.string().min(1, 'Project is required'),
  assignedTo:  z.string().optional(),
})

const priorityColors = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
}

const columnColors = {
  todo: 'border-t-slate-400',
  'in-progress': 'border-t-blue-500',
  'in-review': 'border-t-purple-500',
  done: 'border-t-green-500',
}

function TaskCard({ task, onStatusChange, canEdit }) {
  const [isChanging, setIsChanging] = useState(false)

  const handleStatusChange = async (newStatus) => {
    if (task.status === newStatus) return
    setIsChanging(true)
    await onStatusChange(task._id, newStatus)
    setIsChanging(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all ${isChanging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-snug flex-1">{task.title}</p>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 shrink-0 -mr-1">
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {KANBAN_COLUMNS.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => handleStatusChange(col.id)}
                  className={task.status === col.id ? 'bg-accent' : ''}
                >
                  {task.status === col.id && '✓ '}
                  {col.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium capitalize ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          {task.isOverdue && <AlertCircle className="h-3 w-3 text-red-500" />}
        </div>
        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className={`text-xs flex items-center gap-0.5 ${task.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Calendar className="h-3 w-3" />{formatDate(task.dueDate)}
            </span>
          )}
          {task.assignedTo && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignedTo.avatar} />
              <AvatarFallback className="text-[8px]">{task.assignedTo.name?.[0]}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {task.tags?.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function KanbanColumn({ column, tasks, onStatusChange, canEdit }) {
  return (
    <div className={`flex flex-col min-w-[280px] max-w-[320px] flex-1 rounded-xl border-t-4 bg-muted/30 ${columnColors[column.id]}`}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-2 min-h-[200px] overflow-y-auto">
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onStatusChange={onStatusChange} canEdit={canEdit} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-xs border-2 border-dashed border-border rounded-lg">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const { tasks, fetchTasks, updateTask, updateTaskStatusOptimistic, createTask } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [projectFilter, setProjectFilter] = useState('')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [creating, setCreating] = useState(false)

  const taskForm = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium', status: 'todo' },
  })

  useEffect(() => {
    fetchTasks({ limit: 200 })
    fetchProjects({ limit: 50 })
    if (isAdmin) {
      usersAPI.getAll({ limit: 100 }).then(({ data }) => setAllUsers(data.data || []))
    }
  }, [])

  const filteredTasks = projectFilter
    ? tasks.filter((t) => t.projectId === projectFilter || t.projectId?._id === projectFilter)
    : tasks

  const getColumnTasks = (status) => filteredTasks.filter((t) => t.status === status)

  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId)
    if (!task) return

    // Check permissions
    if (!isAdmin && task.assignedTo?._id !== user?._id) {
      toast({ title: 'Permission denied', description: 'You can only update your own tasks', variant: 'destructive' })
      return
    }

    // Optimistic update
    updateTaskStatusOptimistic(taskId, newStatus)

    // API call
    const result = await updateTask(taskId, { status: newStatus })
    if (!result.success) {
      // Revert on failure
      updateTaskStatusOptimistic(taskId, task.status)
      toast({ title: 'Failed to update task', variant: 'destructive' })
    } else {
      toast({ title: 'Task status updated', variant: 'success' })
    }
  }

  const onCreateTask = async (data) => {
    setCreating(true)
    const result = await createTask(data)
    setCreating(false)
    if (result.success) {
      toast({ title: 'Task created successfully', variant: 'success' })
      setShowCreateTask(false)
      taskForm.reset({ priority: 'medium', status: 'todo' })
      fetchTasks({ limit: 200 })
    } else {
      toast({
        title: 'Failed to create task',
        description: result.error || 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold">Kanban Board</h2>
          <p className="text-muted-foreground text-sm mt-1">Click the dropdown on each task to change status</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          {isAdmin && (
            <Button
              onClick={() => setShowCreateTask(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-h-[500px]">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getColumnTasks(column.id)}
              onStatusChange={handleStatusChange}
              canEdit={true}
            />
          ))}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-indigo-600" />
              Create New Task
            </DialogTitle>
            <DialogDescription>
              Add a new task to the Kanban board
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Title *</label>
              <Input
                {...taskForm.register('title')}
                placeholder="e.g. Update user dashboard"
                className="mt-1"
              />
              {taskForm.formState.errors.title && (
                <p className="text-destructive text-xs mt-1">
                  {taskForm.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                {...taskForm.register('description')}
                placeholder="Provide task details and requirements…"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Project *</label>
              <Select onValueChange={(value) => taskForm.setValue('projectId', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No projects available
                    </div>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {taskForm.formState.errors.projectId && (
                <p className="text-destructive text-xs mt-1">
                  {taskForm.formState.errors.projectId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  defaultValue="todo"
                  onValueChange={(value) => taskForm.setValue('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  defaultValue="medium"
                  onValueChange={(value) => taskForm.setValue('priority', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITIES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isAdmin && allUsers.length > 0 && (
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select onValueChange={(value) => taskForm.setValue('assignedTo', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select team member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input {...taskForm.register('dueDate')} type="date" className="mt-1" />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateTask(false)
                  taskForm.reset({ priority: 'medium', status: 'todo' })
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={creating || projects.length === 0}
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
