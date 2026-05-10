import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Shield, Camera, Save, Lock, Loader2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import useAuthStore from '@/store/authStore'
import { authAPI } from '@/api/auth'
import { toast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', avatar: user?.avatar || '' },
  })

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) })

  const onSaveProfile = async (data) => {
    setSavingProfile(true)
    try {
      const { data: res } = await authAPI.updateProfile(data)
      updateUser(res.data)
      toast({ title: 'Profile updated!', variant: 'success' })
    } catch (err) {
      toast({ title: 'Failed to update', description: err.response?.data?.error, variant: 'destructive' })
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (data) => {
    setSavingPassword(true)
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      toast({ title: 'Password changed!', variant: 'success' })
      passwordForm.reset()
    } catch (err) {
      toast({ title: 'Failed', description: err.response?.data?.error, variant: 'destructive' })
    } finally {
      setSavingPassword(false)
    }
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information</p>
      </motion.div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h3 className="text-xl font-bold">{user?.name}</h3>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={`text-xs capitalize ${user?.role === 'admin' ? 'border-indigo-500/30 text-indigo-500 bg-indigo-500/10' : ''}`}>
                    {user?.role === 'admin' ? <Shield className="h-3 w-3 mr-1 inline" /> : <User className="h-3 w-3 mr-1 inline" />}
                    {user?.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Joined {formatDate(user?.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...profileForm.register('name')} className="pl-10" />
                </div>
                {profileForm.formState.errors.name && (
                  <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={user?.email} disabled className="pl-10 opacity-60" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-sm font-medium">Avatar URL</label>
                <div className="relative mt-1">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...profileForm.register('avatar')} placeholder="https://..." className="pl-10" />
                </div>
                {profileForm.formState.errors.avatar && (
                  <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.avatar.message}</p>
                )}
              </div>
              <Button type="submit" variant="gradient" disabled={savingProfile} className="gap-2">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <Input {...passwordForm.register('currentPassword')} type="password" className="mt-1" placeholder="••••••••" />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-destructive text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <Input {...passwordForm.register('newPassword')} type="password" className="mt-1" placeholder="Min. 8 characters" />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-destructive text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input {...passwordForm.register('confirmPassword')} type="password" className="mt-1" placeholder="Repeat new password" />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-destructive text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" variant="outline" disabled={savingPassword} className="gap-2">
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
