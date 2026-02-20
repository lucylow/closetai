import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Eye, ShoppingBag,
  Shirt, Sparkles, ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown,
  BarChart3, Activity, Target, Zap, Star, Clock
} from "lucide-react";
import { KendoPoweredBadge } from "@/components/KendoPoweredBadge";
import { DEMO_WARDROBE, CATEGORY_LABELS } from "@/lib/data";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const mrrData = [
  { month: "Sep 25", mrr: 420000, users: 8200 },
  { month: "Oct 25", mrr: 680000, users: 14500 },
  { month: "Nov 25", mrr: 890000, users: 22800 },
  { month: "Dec 25", mrr: 1200000, users: 38400 },
  { month: "Jan 26", mrr: 1650000, users: 52100 },
  { month: "Feb 26", mrr: 2100000, users: 68700 },
];

const brandPerformance = [
  { brand: "Gucci", mrr: 2490, dau: 12420, conversion: 0.42, status: "active", trend: "up" },
  { brand: "Nike", mrr: 1890, dau: 8920, conversion: 0.38, status: "active", trend: "up" },
  { brand: "Prada", mrr: 3490, dau: 21800, conversion: 0.47, status: "active", trend: "up" },
  { brand: "Zara", mrr: 990, dau: 6540, conversion: 0.31, status: "active", trend: "stable" },
  { brand: "H&M", mrr: 1240, dau: 9100, conversion: 0.35, status: "trial", trend: "up" },
  { brand: "Louis Vuitton", mrr: 4200, dau: 15200, conversion: 0.52, status: "active", trend: "up" },
  { brand: "Uniqlo", mrr: 780, dau: 4800, conversion: 0.28, status: "trial", trend: "stable" },
  { brand: "Burberry", mrr: 2980, dau: 11300, conversion: 0.44, status: "active", trend: "down" },
];

const categoryData = [
  { name: "Tops", value: 34, color: "#6E4AE0" },
  { name: "Bottoms", value: 22, color: "#9f7ef5" },
  { name: "Outerwear", value: 18, color: "#b39dfa" },
  { name: "Dresses", value: 12, color: "#c7b8fc" },
  { name: "Shoes", value: 9, color: "#dbd1fd" },
  { name: "Accessories", value: 5, color: "#eee9fe" },
];

const recentActivity = [
  { action: "Virtual Try-On", item: "Leather Jacket", time: "2 min ago", status: "completed" },
  { action: "AI Outfit Generated", item: "Spring Casual", time: "15 min ago", status: "completed" },
  { action: "Trend Analysis", item: "Sustainable Fashion", time: "1 hr ago", status: "completed" },
  { action: "Skin Analysis", item: "Color Matching", time: "3 hr ago", status: "completed" },
  { action: "Content Generated", item: "Instagram Post", time: "5 hr ago", status: "completed" },
];

type SortField = "brand" | "mrr" | "dau" | "conversion";
type SortDir = "asc" | "desc";

const Dashboard = () => {
  const [sortField, setSortField] = useState<SortField>("mrr");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [gridPage, setGridPage] = useState(0);
  const pageSize = 5;

  const sortedBrands = useMemo(() => {
    return [...brandPerformance].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [sortField, sortDir]);

  const pagedBrands = sortedBrands.slice(gridPage * pageSize, (gridPage + 1) * pageSize);
  const totalPages = Math.ceil(sortedBrands.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp size={12} className="opacity-30" />;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display gradient-text">Enterprise Dashboard</h1>
          <p className="text-muted-foreground mt-1">KendoReact Cards, Charts & Data Grid</p>
        </div>
        <KendoPoweredBadge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Monthly Recurring Revenue", value: "$2.1M", change: "+18.2%", up: true, icon: DollarSign, color: "from-violet-500 to-purple-600" },
          { title: "Daily Active Users", value: "1.2M", change: "+12.4%", up: true, icon: Users, color: "from-blue-500 to-cyan-500" },
          { title: "Conversion Rate", value: "42%", change: "+3.1%", up: true, icon: Target, color: "from-emerald-500 to-green-500" },
          { title: "LTV:CAC Ratio", value: "3.8x", change: "Target: 3x", up: true, icon: Zap, color: "from-amber-500 to-orange-500" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="k-card group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] bg-gradient-to-br ${kpi.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.color} text-white`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
            <div className="flex items-center gap-1 mt-2">
              {kpi.up ? (
                <ArrowUpRight size={14} className="text-emerald-500" />
              ) : (
                <ArrowDownRight size={14} className="text-red-500" />
              )}
              <span className={`text-xs font-medium ${kpi.up ? "text-emerald-500" : "text-red-500"}`}>
                {kpi.change}
              </span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${60 + i * 10}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                className={`h-full rounded-full bg-gradient-to-r ${kpi.color}`}
              />
            </div>
          </motion.div>
        );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 k-card rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                MRR Growth
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">KendoReact Chart — Nova Theme</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#6E4AE0]" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#9f7ef5]" /> Users</span>
            </div>
          </div>
          <div className="p-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrData}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6E4AE0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6E4AE0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, "Revenue"]}
                />
                <Area type="monotone" dataKey="mrr" stroke="#6E4AE0" strokeWidth={2.5} fill="url(#mrrGrad)" dot={{ fill: "#6E4AE0", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="k-card rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Shirt size={16} className="text-primary" />
              Wardrobe Distribution
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">KendoReact Pie Chart</p>
          </div>
          <div className="p-4 flex justify-center" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-4 grid grid-cols-2 gap-2">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="text-muted-foreground">{cat.name}</span>
                <span className="font-medium ml-auto">{cat.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="k-card rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Brand Performance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">KendoReact Data Grid — Sortable, Pageable</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {sortedBrands.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("brand")}>
                  <span className="flex items-center gap-1">Brand <SortIcon field="brand" /></span>
                </th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("mrr")}>
                  <span className="flex items-center justify-end gap-1">MRR <SortIcon field="mrr" /></span>
                </th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("dau")}>
                  <span className="flex items-center justify-end gap-1">DAU <SortIcon field="dau" /></span>
                </th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort("conversion")}>
                  <span className="flex items-center justify-end gap-1">Conversion <SortIcon field="conversion" /></span>
                </th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {pagedBrands.map((b, i) => (
                <tr key={b.brand} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{b.brand}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {b.status === "active" ? "Active" : "Trial"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono">${b.mrr.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right font-mono">{b.dau.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#6E4AE0] to-[#9f7ef5]"
                          style={{ width: `${b.conversion * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs w-10 text-right">{(b.conversion * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {b.trend === "up" ? <TrendingUp size={14} className="inline text-emerald-500" />
                      : b.trend === "down" ? <TrendingDown size={14} className="inline text-red-500" />
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>{gridPage * pageSize + 1}–{Math.min((gridPage + 1) * pageSize, sortedBrands.length)} of {sortedBrands.length}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGridPage(p => Math.max(0, p - 1))}
              disabled={gridPage === 0}
              className="px-2.5 py-1 rounded-md border border-border/50 hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, p) => (
              <button
                key={p}
                onClick={() => setGridPage(p)}
                className={`px-2.5 py-1 rounded-md border transition-colors ${
                  gridPage === p ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:bg-muted"
                }`}
              >
                {p + 1}
              </button>
            ))}
            <button
              onClick={() => setGridPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={gridPage >= totalPages - 1}
              className="px-2.5 py-1 rounded-md border border-border/50 hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="k-card rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Recent Activity
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">KendoReact ListView</p>
          </div>
          <div className="divide-y divide-border/20">
            {recentActivity.map((act, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{act.action}</div>
                  <div className="text-xs text-muted-foreground">{act.item}</div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">{act.time}</div>
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Done
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="k-card rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Star size={16} className="text-primary" />
              AI Feature Usage
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">KendoReact Progress Bars</p>
          </div>
          <div className="p-5 space-y-5">
            {[
              { feature: "Virtual Try-On (PerfectCorp)", usage: 87, total: "2,340 sessions", color: "#6E4AE0" },
              { feature: "Outfit Generation", usage: 72, total: "1,890 outfits", color: "#9f7ef5" },
              { feature: "Trend Analysis (You.com)", usage: 65, total: "980 searches", color: "#b39dfa" },
              { feature: "Content Creation", usage: 54, total: "620 posts", color: "#c7b8fc" },
              { feature: "Skin Analysis", usage: 41, total: "340 scans", color: "#dbd1fd" },
            ].map(f => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{f.feature}</span>
                  <span className="text-xs text-muted-foreground">{f.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.usage}%` }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ background: f.color }}
                  />
                </div>
                <div className="text-right text-xs text-muted-foreground mt-0.5">{f.usage}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="text-center text-xs text-muted-foreground py-2">
        Dashboard powered by Progress KendoReact Enterprise v12.0.1 — Cards, Charts, Data Grid, Progress Bars
      </div>
    </div>
  );
};

export default Dashboard;
