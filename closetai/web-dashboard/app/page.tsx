import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Brain, 
  Zap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track conversion rates, revenue, and engagement metrics across all your campaigns.'
  },
  {
    icon: Users,
    title: 'Brand Management',
    description: 'Manage multiple brands with unified dashboards and individual performance tracking.'
  },
  {
    icon: Brain,
    title: 'AI Model Training',
    description: 'Train custom AI models on your product catalog for personalized try-on experiences.'
  },
  {
    icon: Zap,
    title: 'Conversion Optimization',
    description: 'Leverage 10B+ try-on sessions data to maximize your conversion rates.'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-white/50 px-4 py-1.5 text-sm font-medium backdrop-blur-sm dark:bg-slate-800/50">
              <Zap className="mr-2 h-4 w-4 text-indigo-500" />
              Enterprise AR Commerce Platform
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ClosetAI
              </span>
              <br />
              Brand Portal
            </h1>
            <p className="mb-8 text-lg text-slate-600 md:text-xl dark:text-slate-300">
              Power your e-commerce with AI-driven virtual try-on experiences. 
              Analytics from 10 billion+ try-on sessions across 847 brands.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/dashboard">
                  Launch Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-white/50 py-12 backdrop-blur-sm dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '$2.1M', label: 'Monthly Revenue' },
              { value: '1.2M', label: 'Daily Active Users' },
              { value: '42%', label: 'Try-On Conversion' },
              { value: '3.8x', label: 'LTV:CAC Ratio' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 md:text-4xl">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Everything you need to scale
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">
              Comprehensive tools for brands to manage their AR commerce presence
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <Card key={i} className="border-0 bg-white/70 shadow-xl backdrop-blur-xl dark:bg-slate-800/70">
                  <CardContent className="pt-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Ready to transform your commerce?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-indigo-100">
                Join 847 brands leveraging ClosetAI to drive conversions and grow revenue.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base">
                  <Link href="/dashboard">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-indigo-100">
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <div>
                <div className="font-bold">ClosetAI</div>
                <div className="text-sm text-slate-500">Brand Portal</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="#" className="hover:text-indigo-600">Privacy</Link>
              <Link href="#" className="hover:text-indigo-600">Terms</Link>
              <Link href="#" className="hover:text-indigo-600">Contact</Link>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 ClosetAI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
