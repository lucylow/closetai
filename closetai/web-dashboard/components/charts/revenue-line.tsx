'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { revenueData } from '@/lib/mock-data'

export default function RevenueLineChart() {
  return (
    <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-2xl col-span-1 lg:col-span-2 hover:shadow-3xl transition-all duration-300 dark:bg-slate-800/70">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center justify-between text-lg">
          Revenue Growth
          <Badge className="text-xs bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white px-3 py-1 rounded-full font-bold backdrop-blur-sm shadow-lg shadow-green-500/25">
            +75% YoY
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] lg:h-[380px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueData} margin={{ top: 12, right: 12, left: 4, bottom: 12 }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6E4AE0" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="100%" stopColor="#34D399" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F8FAFC" strokeDasharray="4 4" className="dark:stroke-slate-700" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tickMargin={16}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickMargin={16}
              tick={{ fontSize: 12, fill: '#64748B' }}
              width={60}
            />
            <Tooltip 
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="mrr" 
              stroke="#6E4AE0" 
              strokeWidth={4}
              dot={{ fill: '#6E4AE0', strokeWidth: 2 }}
              activeDot={{ r: 8, strokeWidth: 3 }}
              name="MRR ($M)"
            />
            <Line 
              type="monotone" 
              dataKey="arr" 
              stroke="#10B981" 
              strokeWidth={4}
              dot={{ fill: '#10B981', strokeWidth: 2 }}
              name="ARR ($M)"
            />
            <Area dataKey="mrr" stroke={false} fillOpacity={1} fill="url(#mrrGradient)" />
            <Area dataKey="arr" stroke={false} fillOpacity={1} fill="url(#arrGradient)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
