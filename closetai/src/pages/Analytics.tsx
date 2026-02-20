import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Eye, ShoppingBag, Shirt } from 'lucide-react';

const stats = [
  { label: 'Total Outfits Created', value: '147', change: '+12%', icon: Shirt },
  { label: 'Wardrobe Items', value: '84', change: '+5', icon: ShoppingBag },
  { label: 'Try-On Sessions', value: '63', change: '+18%', icon: Eye },
  { label: 'Style Score', value: '92', change: '+3', icon: TrendingUp },
];

const weeklyData = [
  { day: 'Mon', outfits: 4, tryons: 2 },
  { day: 'Tue', outfits: 6, tryons: 3 },
  { day: 'Wed', outfits: 3, tryons: 5 },
  { day: 'Thu', outfits: 7, tryons: 4 },
  { day: 'Fri', outfits: 5, tryons: 6 },
  { day: 'Sat', outfits: 8, tryons: 7 },
  { day: 'Sun', outfits: 6, tryons: 3 },
];

const topCategories = [
  { category: 'Tops', count: 28, pct: 33 },
  { category: 'Bottoms', count: 22, pct: 26 },
  { category: 'Shoes', count: 14, pct: 17 },
  { category: 'Accessories', count: 12, pct: 14 },
  { category: 'Outerwear', count: 8, pct: 10 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your wardrobe usage and styling trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">{s.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyData.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-10 text-sm text-muted-foreground">{d.day}</span>
                  <div className="flex-1 flex gap-1">
                    <div
                      className="h-6 bg-primary/80 rounded-sm flex items-center justify-end pr-1"
                      style={{ width: `${(d.outfits / 8) * 100}%` }}
                    >
                      <span className="text-[10px] text-primary-foreground font-medium">{d.outfits}</span>
                    </div>
                    <div
                      className="h-6 bg-secondary rounded-sm flex items-center justify-end pr-1"
                      style={{ width: `${(d.tryons / 8) * 100}%` }}
                    >
                      <span className="text-[10px] text-secondary-foreground font-medium">{d.tryons}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-primary/80 rounded-sm" /> Outfits
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-secondary rounded-sm" /> Try-Ons
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.category}</span>
                    <span className="text-muted-foreground">{c.count} items ({c.pct}%)</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
