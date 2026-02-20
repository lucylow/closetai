'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { metricsData } from '@/lib/mock-data'

const iconMap = {
  DollarSign,
  Users,
  Zap,
  TrendingUp,
}

export default function MetricsGrid() {
  const metrics = [
    {
      key: 'mrr',
      title: 'Monthly Recurring Revenue',
      icon: DollarSign,
    },
    {
      key: 'dau',
      title: 'Daily Active Users',
      icon: Users,
    },
    {
      key: 'conversion',
      title: 'Try-On Conversion',
      icon: Zap,
    },
    {
      key: 'ltvcac',
      title: 'LTV:CAC Ratio',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const data = metricsData[metric.key as keyof typeof metricsData]
        const Icon = metric.icon
        const isUp = data.trend === 'up'

        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 border-white/20 dark:bg-slate-800/70">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6 text-indigo-500" />
                  </div>
                  <Badge 
                    variant={isUp ? "default" : "secondary"}
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isUp 
                        ? 'bg-green-500/90 text-white shadow-lg shadow-green-500/25 hover:bg-green-500 backdrop-blur-sm' 
                        : 'bg-orange-500/90 text-white shadow-lg shadow-orange-500/25 hover:bg-orange-500 backdrop-blur-sm'
                    }`}
                  >
                    {data.change}
                  </Badge>
                </div>
                <CardTitle className="text-3xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  {data.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{metric.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
