import { motion } from 'framer-motion'
import { Moon, Sun, Bell, Shield, Building2, LogOut } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import useUIStore from '@/store/uiStore'
import useAuthStore from '@/store/authStore'
import { toast } from '@/hooks/useToast'

function SettingRow({ icon: Icon, title, description, action }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

export default function SettingsPage() {
  const { theme, setTheme, notifications, markAllNotificationsRead } = useUIStore()
  const { user, logout } = useAuthStore()

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your workspace preferences</p>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <SettingRow
              icon={Sun}
              title="Theme"
              description="Choose your preferred colour scheme"
              action={
                <div className="flex gap-2">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark',  label: 'Dark',  icon: Moon },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={theme === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme(value)}
                      className={`gap-1.5 text-xs ${theme === value ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600' : ''}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Button>
                  ))}
                </div>
              }
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <SettingRow
              icon={Bell}
              title="In-app Notifications"
              description={`${notifications.filter((n) => !n.read).length} unread`}
              action={
                <Button variant="outline" size="sm" className="text-xs" onClick={markAllNotificationsRead}>
                  Mark all read
                </Button>
              }
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold">Account</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <SettingRow
              icon={Shield}
              title="Access Role"
              description={`Signed in as ${user?.role}`}
              action={
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-medium capitalize">
                  {user?.role}
                </span>
              }
            />
            <div className="py-4">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive gap-2 text-xs"
                onClick={() => {
                  logout()
                  toast({ title: 'Signed out successfully', variant: 'success' })
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out of account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ethara AI TaskFlow</p>
                <p className="text-xs text-muted-foreground">v1.0.0 — Internal Enterprise Platform</p>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Built with React.js, Golang, and MongoDB. For internal use by Ethara AI employees only.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
