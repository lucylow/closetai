'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { funnelData, conversionMetrics } from '@/lib/mock-data'

export default function ConversionFunnel() {
  const colors = ['#6E4AE0', '#8B5CF6', '#A78BFA', '#C4B5FD']

  return (
    <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 dark:bg-slate-800/70">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {funnelData.map((stage, index) => {
            const width = (stage.value / funnelData[0].value) * 100
            return (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{stage.stage}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {(stage.value / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  />
                </div>
                {index > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stage.rate}% conversion
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {conversionMetrics.overall}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Overall Conversion</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                4.41x
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Return on Ad Spend</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
