import { useState, useEffect } from "react";
import WeatherWidget from "@/components/daily/WeatherWidget";
import OutfitSuggestions from "@/components/daily/OutfitSuggestions";
import FilterBar, { type FilterType } from "@/components/daily/FilterBar";
import { useRecommendation, type DailyOutfit } from "@/hooks/useRecommendation";
import { useWeather } from "@/hooks/useWeather";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const [outfits, setOutfits] = useState<DailyOutfit[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const { getDailyOutfits } = useRecommendation();
  const { temp, condition, isLoading: weatherLoading } = useWeather();
  const { user } = useAuth();

  const weather = temp != null ? { temp, condition, description: "" } : null;

  useEffect(() => {
    const fetchOutfits = async () => {
      const occasion = filter === "all" ? undefined : filter;
      const suggestions = await getDailyOutfits(undefined, undefined, occasion);
      setOutfits(suggestions);
    };
    fetchOutfits();
  }, [filter, getDailyOutfits]);

  const handleSelectOutfit = (outfit: DailyOutfit) => {
    // Could save to calendar or log wear
    console.log("Selected outfit:", outfit);
  };

  return (
    <div className="page dashboard space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display gradient-text">
            Good morning{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here are your outfit suggestions for today
          </p>
        </div>
        <WeatherWidget weather={weather} loading={weatherLoading} />
      </header>
      <FilterBar currentFilter={filter} onFilterChange={setFilter} />
      <OutfitSuggestions
        outfits={outfits}
        onTryOn={() => {}}
        onSelect={handleSelectOutfit}
      />
    </div>
  );
};

export default Dashboard;
