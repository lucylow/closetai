import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Thermometer, Eye,
  MapPin, RefreshCw, Shirt, Umbrella, Glasses, CloudSun, Snowflake,
  ArrowUp, ArrowDown, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeather } from "@/hooks/useWeather";

type ForecastDay = {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: typeof Sun;
  precipitation: number;
};

type OutfitSuggestion = {
  title: string;
  items: string[];
  reason: string;
  icon: typeof Shirt;
};

const DEMO_FORECAST: ForecastDay[] = [
  { day: "Today", high: 72, low: 58, condition: "Partly Cloudy", icon: CloudSun, precipitation: 10 },
  { day: "Tomorrow", high: 68, low: 55, condition: "Light Rain", icon: CloudRain, precipitation: 65 },
  { day: "Wednesday", high: 74, low: 60, condition: "Sunny", icon: Sun, precipitation: 5 },
  { day: "Thursday", high: 70, low: 57, condition: "Cloudy", icon: Cloud, precipitation: 30 },
  { day: "Friday", high: 65, low: 52, condition: "Rain", icon: CloudRain, precipitation: 80 },
  { day: "Saturday", high: 76, low: 62, condition: "Sunny", icon: Sun, precipitation: 0 },
  { day: "Sunday", high: 73, low: 59, condition: "Partly Cloudy", icon: CloudSun, precipitation: 15 },
];

const DEMO_HOURLY = [
  { time: "Now", temp: 70, icon: CloudSun },
  { time: "11 AM", temp: 71, icon: CloudSun },
  { time: "12 PM", temp: 72, icon: Sun },
  { time: "1 PM", temp: 73, icon: Sun },
  { time: "2 PM", temp: 72, icon: Sun },
  { time: "3 PM", temp: 71, icon: CloudSun },
  { time: "4 PM", temp: 69, icon: Cloud },
  { time: "5 PM", temp: 67, icon: Cloud },
  { time: "6 PM", temp: 65, icon: CloudSun },
  { time: "7 PM", temp: 63, icon: Cloud },
  { time: "8 PM", temp: 61, icon: Cloud },
  { time: "9 PM", temp: 59, icon: Cloud },
];

function getOutfitSuggestions(condition: string, tempF: number): OutfitSuggestion[] {
  const suggestions: OutfitSuggestion[] = [];

  if (tempF >= 75) {
    suggestions.push({
      title: "Light & Breezy",
      items: ["Linen shirt", "Shorts", "Sandals", "Sunglasses"],
      reason: "It's warm — stay cool with breathable fabrics.",
      icon: Sun,
    });
  } else if (tempF >= 60) {
    suggestions.push({
      title: "Casual Layers",
      items: ["T-shirt", "Light jacket", "Jeans", "Sneakers"],
      reason: "Moderate temps — layer up for flexibility.",
      icon: CloudSun,
    });
  } else if (tempF >= 45) {
    suggestions.push({
      title: "Warm & Cozy",
      items: ["Sweater", "Coat", "Boots", "Scarf"],
      reason: "It's chilly — keep warm with heavier layers.",
      icon: Wind,
    });
  } else {
    suggestions.push({
      title: "Bundle Up",
      items: ["Puffer jacket", "Thermal top", "Wool pants", "Insulated boots"],
      reason: "Cold outside — prioritize warmth and insulation.",
      icon: Snowflake,
    });
  }

  if (condition.includes("rain")) {
    suggestions.push({
      title: "Rain Ready",
      items: ["Waterproof jacket", "Umbrella", "Rain boots", "Dark jeans"],
      reason: "Rain expected — go for water-resistant options.",
      icon: Umbrella,
    });
  }

  if (condition.includes("sun") || condition.includes("clear")) {
    suggestions.push({
      title: "Sun Protection",
      items: ["UV-blocking sunglasses", "Wide-brim hat", "Light colors", "SPF moisturizer"],
      reason: "Strong sun today — protect your skin and eyes.",
      icon: Glasses,
    });
  }

  if (suggestions.length < 2) {
    suggestions.push({
      title: "All-Day Versatile",
      items: ["Button-down shirt", "Chinos", "Loafers", "Watch"],
      reason: "A polished look that works from morning to evening.",
      icon: Shirt,
    });
  }

  return suggestions;
}

const Weather = () => {
  const { temp, tempF, condition, description, isLoading } = useWeather();
  const [unit, setUnit] = useState<"F" | "C">("F");

  const displayTemp = unit === "F" ? tempF : temp;
  const unitLabel = unit === "F" ? "°F" : "°C";
  const toUnit = (f: number) => unit === "F" ? f : Math.round((f - 32) * 5 / 9);

  const suggestions = getOutfitSuggestions(condition, tempF);

  const conditionIcon = condition?.includes("rain")
    ? CloudRain
    : condition?.includes("snow")
    ? CloudSnow
    : condition?.includes("cloud")
    ? Cloud
    : Sun;
  const ConditionIcon = conditionIcon;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weather & Style</h1>
          <p className="text-muted-foreground mt-1">AI outfit recommendations based on today's weather</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUnit(u => u === "F" ? "C" : "F")}
          >
            <Thermometer size={14} className="mr-1" />
            {unit === "F" ? "°C" : "°F"}
          </Button>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-violet-500/10 p-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <MapPin size={14} />
            <span>San Francisco, CA</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2">Demo</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-7xl font-bold tracking-tight">
                {isLoading ? "—" : displayTemp}{unitLabel}
              </div>
              <p className="text-xl capitalize mt-2 text-muted-foreground">{condition || "clear"}</p>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <ConditionIcon size={96} className="text-primary/40" strokeWidth={1} />
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8">
            {[
              { label: "Humidity", value: "62%", icon: Droplets },
              { label: "Wind", value: "12 mph", icon: Wind },
              { label: "UV Index", value: "6 (High)", icon: Sun },
              { label: "Visibility", value: "10 mi", icon: Eye },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card/60 border border-border/50">
                  <StatIcon size={18} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-semibold">{stat.value}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shirt size={18} />
            AI Outfit Picks
          </h3>
          <div className="space-y-4">
            {suggestions.map((s, i) => {
              const SugIcon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <SugIcon size={14} className="text-primary" />
                    </div>
                    <span className="font-medium text-sm">{s.title}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {s.items.map((item) => (
                      <span
                        key={item}
                        className="text-xs px-2 py-1 rounded-full bg-card border border-border"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} />
          Hourly Forecast
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {DEMO_HOURLY.map((h, i) => {
            const HIcon = h.icon;
            return (
              <motion.div
                key={h.time}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border min-w-[72px] ${
                  i === 0 ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/50"
                }`}
              >
                <span className="text-xs text-muted-foreground">{h.time}</span>
                <HIcon size={20} className={i === 0 ? "text-primary" : "text-muted-foreground"} />
                <span className="text-sm font-semibold">{toUnit(h.temp)}°</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} />
          7-Day Forecast
        </h3>
        <div className="space-y-2">
          {DEMO_FORECAST.map((day, i) => {
            const DayIcon = day.icon;
            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  i === 0 ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                } transition-colors`}
              >
                <div className="flex items-center gap-3 w-32">
                  <DayIcon size={20} className={i === 0 ? "text-primary" : "text-muted-foreground"} />
                  <span className={`text-sm font-medium ${i === 0 ? "text-primary" : ""}`}>{day.day}</span>
                </div>
                <span className="text-xs text-muted-foreground w-28">{day.condition}</span>
                <div className="flex items-center gap-1 text-xs text-blue-500 w-16">
                  <Droplets size={12} />
                  {day.precipitation}%
                </div>
                <div className="flex items-center gap-3 w-28 justify-end">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <ArrowUp size={12} className="text-red-400" />
                    {toUnit(day.high)}°
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ArrowDown size={12} className="text-blue-400" />
                    {toUnit(day.low)}°
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Weather;
