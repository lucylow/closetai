import { Cloud, CloudRain, Sun, CloudSnow } from "lucide-react";

interface WeatherWidgetProps {
  weather: {
    temp: number;
    condition: string;
    description?: string;
  } | null;
  loading?: boolean;
}

const WeatherWidget = ({ weather, loading }: WeatherWidgetProps) => {
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    );
  }
  if (!weather) return null;

  const Icon =
    weather.condition?.includes("rain") ? CloudRain :
    weather.condition?.includes("snow") ? CloudSnow :
    weather.condition?.includes("cloud") ? Cloud : Sun;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
      <Icon size={20} className="text-primary" />
      <span className="font-semibold">{weather.temp}°C</span>
      <span className="text-sm text-muted-foreground capitalize">{weather.condition}</span>
    </div>
  );
};

export default WeatherWidget;
