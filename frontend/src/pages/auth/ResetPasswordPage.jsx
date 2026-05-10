import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowLeft, Building2, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authAPI } from '@/api/auth'
import { toast } from '@/hooks/useToast'

const schema = z.object({
  token:           z.string().min(1, 'Reset token is required'),
  newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ResetPasswordPage() {
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [success, setSuccess]         = useState(false)
  const [searchParams]                = useSearchParams()
  const navigate                      = useNavigate()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) setValue('token', token)
  }, [searchParams, setValue])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authAPI.resetPassword(data.token, data.newPassword)
      setSuccess(true)
      toast({ title: 'Password reset successfully', variant: 'success' })
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err.response?.data?.error || 'Invalid or expired token',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0f172a] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Ethara AI</p>
            <p className="text-white/40 text-xs leading-tight">TaskFlow</p>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Set New<br />Password
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Enter your reset token and choose a strong new password for your account.
          </p>
        </div>
        <p className="text-white/20 text-xs relative z-10">© 2024 Ethara AI. Internal use only.</p>
      </div>

      {/* Right form panel */}
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

          {!success ? (
            <>
              <h1 className="text-2xl font-bold mb-1">Reset Password</h1>
              <p className="text-muted-foreground text-sm mb-7">
                Enter your reset token and new password
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Token field */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Reset Token</label>
                  <Input
                    {...register('token')}
                    placeholder="Paste your reset token here"
                    className="font-mono text-xs"
                  />
                  {errors.token && (
                    <p className="text-destructive text-xs">{errors.token.message}</p>
                  )}
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...register('newPassword')}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-destructive text-xs">{errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
                  disabled={isLoading}
                >
                  {isLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting…</>
                    : 'Reset Password'
                  }
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">Password Reset!</h1>
              <p className="text-muted-foreground text-sm">
                Your password has been updated successfully. Redirecting to login…
              </p>
              <Link to="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                  Go to Sign In
                </Button>
              </Link>
            </motion.div>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Get a new reset token
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
