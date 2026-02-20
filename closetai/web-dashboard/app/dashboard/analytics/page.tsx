'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Users, ShoppingCart } from 'lucide-react'
import MetricsGrid from '@/components/dashboard/metrics-grid'
import ConversionFunnel from '@/components/dashboard/conversion-funnel'

const analyticsMetrics = [
  { title: 'Total Impressions', value: '10M', change: '+24%', icon: Users },
  { title: 'Try-On Sessions', value: '4.2M', change: '+18%', icon: TrendingUp },
  { title: 'Conversion Rate', value: '42%', change: '+3.2pts', icon: BarChart3 },
  { title: 'Revenue', value: '$2.1M', change: '+18%', icon: ShoppingCart },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-200 mb-2">
          Analytics
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Deep dive into your conversion funnel and ROI metrics
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <Badge className="bg-green-500/90 text-white">{metric.change}</Badge>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{metric.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Conversion Funnel */}
      <ConversionFunnel />

      {/* Additional Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { source: 'Organic Search', value: 45, color: 'bg-indigo-500' },
                { source: 'Social Media', value: 28, color: 'bg-purple-500' },
                { source: 'Direct', value: 18, color: 'bg-emerald-500' },
                { source: 'Referral', value: 9, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.source} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{item.source}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { device: 'Mobile', value: 68, color: 'bg-indigo-500' },
                { device: 'Desktop', value: 24, color: 'bg-purple-500' },
                { device: 'Tablet', value: 8, color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.device} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{item.device}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
