import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, Building2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useAuthStore from '@/store/authStore'
import useUIStore from '@/store/uiStore'
import { toast } from '@/hooks/useToast'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false)
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore()
  const { theme } = useUIStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate])

  const onSubmit = async (data) => {
    clearError()
    const result = await login(data)
    if (result.success) {
      toast({ title: 'Welcome back', variant: 'success' })
      navigate('/dashboard')
    } else {
      toast({ title: 'Authentication failed', description: result.error, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel — branding ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Top — logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Ethara AI</p>
            <p className="text-white/40 text-xs leading-tight">TaskFlow</p>
          </div>
        </div>

        {/* Middle — headline */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Enterprise Task<br />Management
            </h2>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Centralized project tracking, team collaboration, and productivity analytics for Ethara AI teams.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Role-based access control',
                'Real-time project tracking',
                'Department-level analytics',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-white/60 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <p className="text-white/20 text-xs relative z-10">
          © 2024 Ethara AI. Internal use only.
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Ethara AI TaskFlow</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-muted-foreground text-sm mb-7">
            Access your Ethara AI workspace
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="you@ethara.ai"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
              disabled={isLoading}
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                : 'Sign In'
              }
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Request access
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-lg bg-muted/60 border border-border text-xs">
            <p className="font-semibold text-foreground mb-2">Demo Credentials</p>
            <div className="space-y-1 text-muted-foreground">
              <p>Admin — sainih116@gmail.com / Admin1234</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
