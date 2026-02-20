'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, ShoppingCart, Mail, Plus } from 'lucide-react'
import { brandLeaderboard } from '@/lib/mock-data'

export default function BrandsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-purple-200 mb-2">
            Brands
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Manage and monitor your brand partnerships
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">847</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">+24</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">New This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">$2.1M</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand List */}
      <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {brandLeaderboard.map((brand) => (
              <div key={brand.rank} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {brand.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{brand.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{brand.tryons} try-ons</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{brand.revenue}</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {brand.growth}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
