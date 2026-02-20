// Mock data for ClosetAI Brand Portal Dashboard

export const metricsData = {
  mrr: {
    value: '$2.1M',
    change: '+18.2%',
    trend: 'up' as const,
    description: '847 active brands',
  },
  dau: {
    value: '1.2M',
    change: '+12.4%',
    trend: 'up' as const,
    description: '87% D30 retention',
  },
  conversion: {
    value: '42%',
    change: '+3.2pts',
    trend: 'up' as const,
    description: 'Industry: 28%',
  },
  ltvcac: {
    value: '3.8x',
    change: '+0.4x',
    trend: 'up' as const,
    description: 'Sustainable growth',
  },
}

export const revenueData = [
  { date: 'Jan 26', mrr: 1.2, arr: 14.4, brands: 342 },
  { date: 'Feb 26', mrr: 2.1, arr: 25.2, brands: 847 },
  { date: 'Mar 26', mrr: 3.4, arr: 40.8, brands: 1242 },
  { date: 'Apr 26', mrr: 4.2, arr: 50.4, brands: 1523 },
  { date: 'May 26', mrr: 5.1, arr: 61.2, brands: 1834 },
  { date: 'Jun 26', mrr: 6.3, arr: 75.6, brands: 2142 },
]

export const funnelData = [
  { stage: 'Impressions', value: 10000000, rate: 100 },
  { stage: 'Try-Ons', value: 4200000, rate: 42 },
  { stage: 'Add to Cart', value: 1260000, rate: 30 },
  { stage: 'Purchase', value: 441000, rate: 35 },
]

export const brandLeaderboard = [
  { rank: 1, name: 'Nordstrom', revenue: '$124.2K', growth: '+24%', tryons: '2.1M' },
  { rank: 2, name: 'ASOS', revenue: '$98.7K', growth: '+18%', tryons: '1.8M' },
  { rank: 3, name: 'Zara', revenue: '$87.3K', growth: '+21%', tryons: '1.5M' },
  { rank: 4, name: 'H&M', revenue: '$76.1K', growth: '+15%', tryons: '1.2M' },
  { rank: 5, name: 'Uniqlo', revenue: '$65.8K', growth: '+19%', tryons: '980K' },
]

export const recentActivity = [
  { id: 1, brand: 'Nordstrom', action: 'New campaign launched', time: '2 min ago', type: 'campaign' },
  { id: 2, brand: 'ASOS', action: 'Model training completed', time: '15 min ago', type: 'ai' },
  { id: 3, brand: 'Zara', action: 'Subscription upgraded', time: '1 hour ago', type: 'billing' },
  { id: 4, brand: 'H&M', action: 'New team member added', time: '2 hours ago', type: 'team' },
  { id: 5, brand: 'Uniqlo', action: 'API integration completed', time: '3 hours ago', type: 'integration' },
]

export const aiTrainingModels = [
  { id: 1, name: 'Summer Collection 2026', status: 'training' as const, progress: 67, images: '45,230', accuracy: 94.2 },
  { id: 2, name: 'Winter Edit', status: 'ready' as const, progress: 100, images: '32,891', accuracy: 96.8 },
  { id: 3, name: 'Accessories Line', status: 'queued' as const, progress: 0, images: '12,450', accuracy: null },
]

export const conversionMetrics = {
  impressionToTryon: 42,
  tryonToCart: 30,
  cartToPurchase: 35,
  overall: 4.41,
}
