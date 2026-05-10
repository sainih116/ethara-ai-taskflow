import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useUIStore from '@/store/uiStore'
import { formatRelative } from '@/utils/formatters'

const typeIcons = {
  success: { icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  error: { icon: AlertCircle, color: 'text-red-500 bg-red-500/10' },
  info: { icon: Info, color: 'text-blue-500 bg-blue-500/10' },
  default: { icon: Zap, color: 'text-indigo-500 bg-indigo-500/10' },
}

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useUIStore()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {unread > 0 ? `${unread} unread` : 'All caught up!'}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={markAllNotificationsRead} className="gap-2">
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearNotifications} className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-muted-foreground text-sm mt-1">You're all caught up! Check back later.</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n) => {
              const { icon: Icon, color } = typeIcons[n.variant] || typeIcons.default
              return (
                <motion.div key={n.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }} layout>
                  <Card className={`cursor-pointer transition-all hover:shadow-md ${!n.read ? 'border-primary/30 bg-primary/5' : ''}`}
                    onClick={() => markNotificationRead(n.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!n.read ? '' : 'text-muted-foreground'}`}>
                              {n.title}
                            </p>
                            {!n.read && <Badge className="text-[10px] shrink-0 h-4">New</Badge>}
                          </div>
                          {n.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
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
    </div>
  )
}
