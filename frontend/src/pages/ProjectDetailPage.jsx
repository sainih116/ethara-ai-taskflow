import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Plus, Calendar, Users, CheckCircle2, Clock,
  AlertCircle, MoreVertical, Trash2, Edit, Circle, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import useProjectStore from '@/store/projectStore'
import useTaskStore from '@/store/taskStore'
import useAuthStore from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import { formatDate, formatRelative } from '@/utils/formatters'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/utils/constants'
import { usersAPI } from '@/api/users'

const priorityColors = {
  urgent: 'text-red-500 bg-red-50 dark:bg-red-950/30',
  high: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  medium: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  low: 'text-green-500 bg-green-50 dark:bg-green-950/30',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProject, fetchProject, updateProject } = useProjectStore()
  const { tasks, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [showCreateTask, setShowCreateTask] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchProject(id)
    fetchTasks({ projectId: id, limit: 100 })
    if (isAdmin) usersAPI.getAll({ limit: 100 }).then(({ data }) => setAllUsers(data.data || []))
  }, [id])

  const projectTasks = tasks.filter((t) => t.projectId === id || t.projectId?._id === id || t.projectId === id)
  const doneTasks = projectTasks.filter((t) => t.status === 'done').length
  const progress = projectTasks.length ? Math.round((doneTasks / projectTasks.length) * 100) : 0

  const onCreateTask = async (data) => {
    setCreating(true)
    const result = await createTask({ ...data, projectId: id })
    setCreating(false)
    if (result.success) {
      toast({ title: 'Task created!', variant: 'success' })
      setShowCreateTask(false)
      reset()
    } else {
      toast({ title: 'Failed', description: result.error, variant: 'destructive' })
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus })
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    const result = await deleteTask(taskId)
    if (result.success) toast({ title: 'Task deleted', variant: 'success' })
  }

  if (!currentProject) {
    return (
      <div className="p-6">
        <div className="shimmer h-8 w-48 rounded mb-4" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer h-16 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-4 h-8 rounded-full shrink-0" style={{ background: currentProject.color || '#6366f1' }} />
            <h2 className="text-2xl font-bold truncate">{currentProject.title}</h2>
            <Badge variant="outline" className="capitalize shrink-0">{currentProject.status}</Badge>
          </div>
          {currentProject.description && (
            <p className="text-muted-foreground text-sm mt-1 ml-7">{currentProject.description}</p>
          )}
        </div>
        {isAdmin && (
          <Button variant="gradient" onClick={() => setShowCreateTask(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: projectTasks.length, icon: Circle, color: 'text-blue-500' },
          { label: 'Completed', value: doneTasks, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'In Progress', value: projectTasks.filter((t) => t.status === 'in-progress').length, icon: Clock, color: 'text-orange-500' },
          { label: 'Overdue', value: projectTasks.filter((t) => t.isOverdue).length, icon: AlertCircle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {['tasks', 'members'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {activeTab === 'tasks' && (
        <div className="space-y-2">
          {projectTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No tasks yet. {isAdmin && 'Add the first task!'}</p>
            </div>
          ) : (
            projectTasks.map((task, i) => (
              <motion.div key={task._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={`hover:shadow-md transition-shadow ${task.isOverdue ? 'border-red-500/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Status selector */}
                      <select value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        disabled={!isAdmin && task.assignedTo?._id !== user?._id}>
                        {Object.entries(TASK_STATUSES).map(([v, { label }]) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className={`text-xs flex items-center gap-1 ${task.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            <Calendar className="h-3 w-3" />{formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.assignedTo && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignedTo.avatar} />
                            <AvatarFallback className="text-[9px]">{task.assignedTo.name?.[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTask(task._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(currentProject.members || []).map((member) => (
            <Card key={member._id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  <Badge variant="outline" className="text-xs mt-1 capitalize">{member.role}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCreateTask)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input {...register('title', { required: 'Title is required' })} placeholder="Task title" className="mt-1" />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea {...register('description')} placeholder="Task details..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select {...register('priority')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
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
                <select {...register('assignedTo')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Unassigned</option>
                  {allUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateTask(false)}>Cancel</Button>
              <Button type="submit" variant="gradient" disabled={creating}>
                {creating ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
