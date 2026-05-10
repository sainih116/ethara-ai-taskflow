import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Building2, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authAPI } from '@/api/auth'
import { toast } from '@/hooks/useToast'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const res = await authAPI.forgotPassword(data.email)
      const token = res.data?.data?.resetToken
      setResetToken(token || '')
      setSubmitted(true)
    } catch (err) {
      toast({
        title: 'Something went wrong',
        description: err.response?.data?.error || 'Please try again',
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
            Account<br />Recovery
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Enter your work email and we'll generate a secure reset token for your account.
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

          {!submitted ? (
            <>
              <h1 className="text-2xl font-bold mb-1">Forgot Password</h1>
              <p className="text-muted-foreground text-sm mb-7">
                Enter your work email to receive a reset token
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
                  disabled={isLoading}
                >
                  {isLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating token…</>
                    : 'Generate Reset Token'
                  }
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Token Generated</h1>
                  <p className="text-muted-foreground text-sm">Use this token to reset your password</p>
                </div>
              </div>

              {resetToken && (
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Your Reset Token (valid for 1 hour):</p>
                  <p className="text-xs font-mono break-all text-foreground select-all bg-background p-2 rounded border">
                    {resetToken}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Copy this token and use it on the reset password page.
                  </p>
                </div>
              )}

              <Link to={`/reset-password${resetToken ? `?token=${resetToken}` : ''}`}>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Continue to Reset Password
                </Button>
              </Link>
            </motion.div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
