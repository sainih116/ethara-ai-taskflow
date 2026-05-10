import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, FolderOpen, Calendar, Users,
  MoreVertical, Trash2, Eye, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useProjectStore from '@/store/projectStore'
import useAuthStore from '@/store/authStore'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { PROJECT_STATUSES, PROJECT_COLORS } from '@/utils/constants'
import { usersAPI } from '@/api/users'

const projectSchema = z.object({
  title:       z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  status:      z.string().optional(),
  deadline:    z.string().optional(),
})

const statusStyle = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
  'on-hold': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
  completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50',
  archived:  'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400',
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [showCreate, setShowCreate]       = useState(false)
  const [allUsers, setAllUsers]           = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0])
  const [creating, setCreating]           = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
  })

  useEffect(() => {
    fetchProjects({ limit: 50 })
    if (isAdmin) {
      usersAPI.getAll({ limit: 100 }).then(({ data }) => setAllUsers(data.data || []))
    }
  }, [])

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const onSubmit = async (data) => {
    setCreating(true)
    const result = await createProject({ ...data, members: selectedMembers, color: selectedColor })
    setCreating(false)
    if (result.success) {
      toast({ title: 'Project created', variant: 'success' })
      setShowCreate(false)
      reset()
      setSelectedMembers([])
      setSelectedColor(PROJECT_COLORS[0])
    } else {
      toast({ title: 'Failed to create project', description: result.error, variant: 'destructive' })
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its tasks?')) return
    const result = await deleteProject(id)
    if (result.success) toast({ title: 'Project deleted', variant: 'success' })
    else toast({ title: 'Failed to delete', variant: 'destructive' })
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{projects.length} total projects</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'active', 'on-hold', 'completed', 'archived'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className={`capitalize text-xs ${statusFilter === s ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : ''}`}
            >
              {s || 'All'}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="shimmer h-4 w-3/4 rounded" />
                <div className="shimmer h-3 w-full rounded" />
                <div className="shimmer h-3 w-1/2 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
            <FolderOpen className="h-7 w-7 text-indigo-600" />
          </div>
          <p className="text-base font-semibold">No projects found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? 'Create your first project to get started.' : 'No projects have been assigned to you yet.'}
          </p>
          {isAdmin && (
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((project, i) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className="cursor-pointer"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <Card className="h-full hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200">
                  <CardContent className="p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-2.5 h-10 rounded-full shrink-0"
                          style={{ background: project.color || '#4f46e5' }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{project.title}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {project.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon-sm" className="shrink-0 -mr-1 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`) }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => handleDelete(project._id, e)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Status badge */}
                    <Badge
                      variant="outline"
                      className={`text-xs mb-3 ${statusStyle[project.status] || ''}`}
                    >
                      {PROJECT_STATUSES[project.status]?.label || project.status}
                    </Badge>

                    {/* Task count */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Tasks</span>
                        <span className="font-medium">{project.taskCount || 0}</span>
                      </div>
                      <Progress value={0} className="h-1" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {(project.members || []).slice(0, 4).map((m) => (
                          <Avatar key={m._id} className="h-6 w-6 border-2 border-card">
                            <AvatarImage src={m.avatar} />
                            <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                              {m.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {(project.members?.length || 0) > 4 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium">
                            +{project.members.length - 4}
                          </div>
                        )}
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.deadline)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Create New Project
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project Title *</label>
              <Input {...register('title')} placeholder="e.g. Q1 Product Roadmap" className="mt-1" />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                {...register('description')}
                placeholder="What is this project about?"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  {...register('status')}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Deadline</label>
                <Input {...register('deadline')} type="date" className="mt-1" />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-sm font-medium">Project Colour</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Member picker */}
            {allUsers.length > 0 && (
              <div>
                <label className="text-sm font-medium">Assign Members</label>
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1 border border-border rounded-md p-2">
                  {allUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded p-1.5">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={(e) =>
                          setSelectedMembers(
                            e.target.checked
                              ? [...selectedMembers, u._id]
                              : selectedMembers.filter((id) => id !== u._id)
                          )
                        }
                        className="accent-indigo-600"
                      />
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback className="text-[9px]">{u.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1">{u.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
                    </label>
                  ))}
                </div>
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
                {creating ? 'Creating…' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
