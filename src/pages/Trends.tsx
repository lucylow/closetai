import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Flame, Search, ExternalLink } from "lucide-react";
import { TRENDS } from "@/lib/data";

const directionIcon = (d: string) => {
  if (d === "up") return <TrendingUp size={16} className="text-accent" />;
  if (d === "down") return <TrendingDown size={16} className="text-destructive" />;
  return <Minus size={16} className="text-muted-foreground" />;
};

const TrendsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">Fashion Trends</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <Search size={14} /> Real‑time insights powered by You.com
        </p>
      </div>

      {/* Trend cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TRENDS.map((trend, i) => (
          <motion.div
            key={trend.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-6 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Flame size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold font-display">{trend.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {directionIcon(trend.direction)}
                    <span className="text-muted-foreground capitalize">{trend.direction}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{trend.score}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${trend.score}%` }}
                transition={{ delay: i * 0.08 + 0.3, duration: 0.6 }}
              />
            </div>

            <p className="text-sm text-muted-foreground">{trend.description}</p>

            <a href="#" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View sources <ExternalLink size={10} />
            </a>
          </motion.div>
        ))}
      </div>

      {/* Insight card */}
      <div className="glass p-8 text-center space-y-3" style={{ borderRadius: "2rem" }}>
        <h2 className="text-xl font-bold font-display">💡 AI Style Insight</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Based on current trends, try pairing your <strong>Leather Jacket</strong> with <strong>Wide-Leg Trousers</strong> for a modern silhouette that's scoring high across street style this season.
        </p>
        <span className="trend-badge"><Flame size={12} /> Confidence: 92%</span>
      </div>
    </div>
  );
};

export default TrendsPage;
