'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Upload, Play, Pause, CheckCircle, Clock, Loader2, Plus } from 'lucide-react'
import { aiTrainingModels } from '@/lib/mock-data'

export default function AITrainingPage() {
  const statusColors = {
    training: 'bg-blue-500/90 text-white',
    ready: 'bg-green-500/90 text-white',
    queued: 'bg-amber-500/90 text-white',
  }

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
            AI Training
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Train custom models on your product catalog
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          New Model
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <div>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Models Training</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Models Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold">234K</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Images Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Models List */}
      <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl dark:bg-slate-800/70">
        <CardHeader>
          <CardTitle>Training Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiTrainingModels.map((model) => (
              <div key={model.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{model.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{model.images} images</p>
                    </div>
                  </div>
                  <Badge className={statusColors[model.status]}>
                    {model.status === 'training' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {model.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {model.status === 'queued' && <Clock className="h-3 w-3 mr-1" />}
                    {model.status.charAt(0).toUpperCase() + model.status.slice(1)}
                  </Badge>
                </div>
                {model.status === 'training' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-medium">{model.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${model.progress}%` }} />
                    </div>
                  </div>
                )}
                {model.status === 'ready' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Accuracy</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{model.accuracy}%</span>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  {model.status === 'training' ? (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : model.status === 'ready' ? (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Deploy
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Waiting...
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Add Images
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
