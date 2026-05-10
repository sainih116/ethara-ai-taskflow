import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Users, Mail, Calendar, Clock,
  MoreVertical, Trash2, UserPlus, ListTodo, Shield, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import useAuthStore from '@/store/authStore'
import { usersAPI } from '@/api/users'
import { projectsAPI } from '@/api/projects'
import { tasksAPI } from '@/api/tasks'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { TASK_PRIORITIES } from '@/utils/constants'

const memberSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role:     z.enum(['admin', 'member']),
})

const taskSchema = z.object({
  title:       z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  priority:    z.string().optional(),
  deadline:    z.string().optional(),
  projectId:   z.string().min(1, 'Project is required'),
})

const roleStyle = {
  admin:  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50',
  member: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50',
}

export default function TeamPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [members, setMembers]           = useState([])
  const [projects, setProjects]         = useState([])
  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState('')
  const [isLoading, setIsLoading]       = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAssignTask, setShowAssignTask] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [creating, setCreating]         = useState(false)
  const [assigning, setAssigning]       = useState(false)

  const memberForm = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: { role: 'member' },
  })

  const taskForm = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium' },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, projectsRes] = await Promise.all([
        usersAPI.getAll({ limit: 100 }),
        projectsAPI.getAll({ limit: 100 }),
      ])
      setMembers(usersRes.data.data || [])
      setProjects(projectsRes.data.data || [])
    } catch (error) {
      toast({ title: 'Failed to load data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || m.role === roleFilter
    return matchSearch && matchRole
  })

  const onCreateMember = async (data) => {
    setCreating(true)
    try {
      await usersAPI.create(data)
      toast({ title: 'Member created successfully', variant: 'success' })
      setShowAddMember(false)
      memberForm.reset()
      loadData()
    } catch (error) {
      toast({
        title: 'Failed to create member',
        description: error.response?.data?.error || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const onAssignTask = async (data) => {
    setAssigning(true)
    try {
      await tasksAPI.create({
        ...data,
        assignedTo: selectedMember._id,
        status: 'todo',
      })
      toast({ title: 'Task assigned successfully', variant: 'success' })
      setShowAssignTask(false)
      taskForm.reset()
      setSelectedMember(null)
    } catch (error) {
      toast({
        title: 'Failed to assign task',
        description: error.response?.data?.error || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setAssigning(false)
    }
  }

  const handleDeleteMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from the team? This action cannot be undone.`)) return
    try {
      await usersAPI.delete(memberId)
      toast({ title: 'Member removed successfully', variant: 'success' })
      loadData()
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: error.response?.data?.error || 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const openAssignDialog = (member) => {
    setSelectedMember(member)
    setShowAssignTask(true)
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {members.length} total member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowAddMember(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
          >
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['', 'admin', 'member'].map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(r)}
              className={`capitalize text-xs ${
                roleFilter === r ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : ''
              }`}
            >
              {r || 'All Roles'}
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
                <div className="shimmer h-12 w-12 rounded-full" />
                <div className="shimmer h-4 w-3/4 rounded" />
                <div className="shimmer h-3 w-full rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
            <Users className="h-7 w-7 text-indigo-600" />
          </div>
          <p className="text-base font-semibold">No team members found</p>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? 'Add your first team member to get started.' : 'No members match your search.'}
          </p>
          {isAdmin && (
            <Button
              onClick={() => setShowAddMember(true)}
              className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <UserPlus className="h-4 w-4" /> Add Member
            </Button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((member, i) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="h-full hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-base font-semibold">
                            {member.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{member.name}</h3>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                      </div>
                      {isAdmin && member._id !== user._id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="shrink-0 -mr-1 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAssignDialog(member)}>
                              <ListTodo className="h-4 w-4 mr-2" /> Assign Task
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteMember(member._id, member.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Role Badge */}
                    <Badge
                      variant="outline"
                      className={`text-xs mb-3 ${roleStyle[member.role] || ''}`}
                    >
                      {member.role === 'admin' ? (
                        <Shield className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      {member.role === 'admin' ? 'Administrator' : 'Team Member'}
                    </Badge>

                    {/* Stats */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Joined
                        </span>
                        <span className="font-medium text-foreground">
                          {formatDate(member.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Last Active
                        </span>
                        <span className="font-medium text-foreground">
                          {member.lastActive ? formatDate(member.lastActive) : 'Never'}
                        </span>
                      </div>
                    </div>

                    {/* Assign Task Button (for admin) */}
                    {isAdmin && member._id !== user._id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 text-xs"
                        onClick={() => openAssignDialog(member)}
                      >
                        <ListTodo className="h-3 w-3 mr-1.5" />
                        Assign Task
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-600" />
              Add New Team Member
            </DialogTitle>
            <DialogDescription>
              Create a new member account. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={memberForm.handleSubmit(onCreateMember)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                {...memberForm.register('name')}
                placeholder="e.g. John Doe"
                className="mt-1"
              />
              {memberForm.formState.errors.name && (
                <p className="text-destructive text-xs mt-1">
                  {memberForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                {...memberForm.register('email')}
                type="email"
                placeholder="john.doe@etharaai.com"
                className="mt-1"
              />
              {memberForm.formState.errors.email && (
                <p className="text-destructive text-xs mt-1">
                  {memberForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Password *</label>
              <Input
                {...memberForm.register('password')}
                type="password"
                placeholder="Minimum 6 characters"
                className="mt-1"
              />
              {memberForm.formState.errors.password && (
                <p className="text-destructive text-xs mt-1">
                  {memberForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Role *</label>
              <Select
                defaultValue="member"
                onValueChange={(value) => memberForm.setValue('role', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Team Member</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddMember(false)
                  memberForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={showAssignTask} onOpenChange={setShowAssignTask}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-indigo-600" />
              Assign Task to {selectedMember?.name}
            </DialogTitle>
            <DialogDescription>
              Create and assign a new task to this team member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={taskForm.handleSubmit(onAssignTask)} className="space-y-4">
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

              <div>
                <label className="text-sm font-medium">Deadline</label>
                <Input {...taskForm.register('deadline')} type="date" className="mt-1" />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAssignTask(false)
                  taskForm.reset()
                  setSelectedMember(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={assigning || projects.length === 0}
              >
                {assigning ? 'Assigning…' : 'Assign Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
