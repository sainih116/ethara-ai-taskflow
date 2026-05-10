import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2, CheckCircle2, Users, BarChart3, Shield,
  ArrowRight, Layers, Clock, ChevronRight, Kanban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: Layers,       title: 'Project Management',    desc: 'Create and track projects across departments with full deadline and progress visibility.' },
  { icon: Users,        title: 'Team Collaboration',    desc: 'Assign tasks to team members, manage workloads, and keep everyone aligned.' },
  { icon: BarChart3,    title: 'Analytics Dashboard',   desc: 'Monitor completion rates, team performance, and project health in real time.' },
  { icon: Shield,       title: 'Role-Based Access',     desc: 'Admins manage everything. Members see and update only their assigned work.' },
  { icon: Clock,        title: 'Deadline Tracking',     desc: 'Overdue alerts and priority labels keep critical tasks front and centre.' },
  { icon: Kanban,       title: 'Kanban Workflow',       desc: 'Drag-and-drop boards give teams a clear picture of work in progress.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/5 sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm">Ethara AI</span>
              <span className="text-white/40 text-xs ml-1.5">TaskFlow</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Internal Enterprise Platform — Ethara AI
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
              One platform for<br />
              <span className="text-indigo-400">all your projects</span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
              Ethara AI TaskFlow keeps every team, project, and deadline organised in one place — from day one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-7 gap-2 w-full sm:w-auto">
                  Create Account <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 h-11 px-7 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Real dashboard preview — no fake numbers */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-16"
          >
            <div className="rounded-xl border border-white/8 bg-[#1e293b] p-1 shadow-2xl shadow-black/40">
              <div className="rounded-lg bg-[#0f172a] p-6">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                  <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
                    <Building2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/60 text-sm">Ethara AI TaskFlow — Dashboard</span>
                  <span className="ml-auto text-xs text-white/25">Sign in to see your live data</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Projects',  color: 'text-indigo-400' },
                    { label: 'Active Tasks',    color: 'text-blue-400' },
                    { label: 'Completed',       color: 'text-emerald-400' },
                    { label: 'Overdue',         color: 'text-red-400' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/4 rounded-lg p-4 border border-white/5">
                      <p className={`text-2xl font-bold ${s.color}`}>—</p>
                      <p className="text-white/40 text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Built for enterprise teams</h2>
            <p className="text-white/40 text-base">Every feature designed for how Ethara AI teams actually work</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl border border-white/6 bg-white/3 hover:border-indigo-500/30 hover:bg-white/5 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-4">
                  <f.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-2xl border border-indigo-500/20 bg-indigo-600/8"
          >
            <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-white/40 mb-7">Register your account and start managing projects immediately.</p>
            <Link to="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 gap-2">
                Create Account <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
              <Building2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-white/50 text-sm font-medium">Ethara AI TaskFlow</span>
          </div>
          <p className="text-white/25 text-xs">© 2024 Ethara AI. Internal use only.</p>
        </div>
      </footer>
    </div>
  )
}
