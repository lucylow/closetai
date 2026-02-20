'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Brain, 
  CreditCard,
  Settings,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/brands', label: 'Brands', icon: Users },
  { href: '/dashboard/ai-training', label: 'AI Training', icon: Brain },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
]

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              ClosetAI
            </h1>
            <p className="text-xs text-slate-400 font-medium">Brand Portal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-400 hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <motion.div
              key={item.href}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start h-14 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 backdrop-blur-sm border-white/20 shadow-xl shadow-white/10' 
                    : 'hover:bg-white/5 hover:backdrop-blur-sm text-slate-300 hover:text-white'
                }`}
                asChild
              >
                <Link href={item.href}>
                  <Icon className={`h-5 w-5 mr-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-left font-medium">{item.label}</span>
                </Link>
              </Button>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-8 border-t border-slate-800/50 mt-auto"
      >
        <Button variant="outline" className="w-full h-14 rounded-xl border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-slate-300 hover:text-white">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </motion.div>
    </div>
  )
}
