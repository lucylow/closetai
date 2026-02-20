'use client'

import { motion } from 'framer-motion'
import MetricsGrid from '@/components/dashboard/metrics-grid'
import RevenueLineChart from '@/components/charts/revenue-line'
import ConversionFunnel from '@/components/dashboard/conversion-funnel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { brandLeaderboard, recentActivity } from '@/lib/mock-data'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center lg:text-left"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-200 leading-tight tracking-tight mb-4">
          ClosetAI Enterprise
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 font-medium max-w-3xl mx-auto lg:mx-0">
          Real-time ROI analytics from 10B+ try-on sessions powering 847 brands
        </p>
      </motion.div>

      {/* KPI Metrics */}
      <MetricsGrid />

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueLineChart />
        <ConversionFunnel />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Brand Leaderboard */}
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-2xl dark:bg-slate-800/70">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {brandLeaderboard.map((brand) => (
                <div key={brand.rank} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      brand.rank <= 3 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-600'
                    }`}>
                      {brand.rank}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{brand.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{brand.tryons} try-ons</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{brand.revenue}</p>
                    <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                      {brand.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-2xl dark:bg-slate-800/70">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      <span className="text-indigo-600 dark:text-indigo-400">{activity.brand}</span>
                      {' '}{activity.action}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{activity.time}</p>
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
