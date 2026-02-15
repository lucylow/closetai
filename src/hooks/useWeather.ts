import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type WeatherData = {
  temp: number;
  condition: string;
  description?: string;
};

const MOCK_WEATHER: WeatherData = { temp: 21, condition: "clear", description: "Possible rain later" };

function getDefaultCoords(): { lat: number; lon: number } {
  return { lat: 37.77, lon: -122.42 };
}

export function useWeather() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["weather", user?.id],
    queryFn: async () => {
      if (!user) return MOCK_WEATHER;
      let lat = getDefaultCoords().lat;
      let lon = getDefaultCoords().lon;
      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        }
      } catch {
        // Use default coords
      }
      try {
        const res = await api.get<{ temp: number; condition: string }>(
          `/weather?lat=${lat}&lon=${lon}`,
          true
        );
        return res as WeatherData;
      } catch {
        return MOCK_WEATHER;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });

  const weather = data ?? MOCK_WEATHER;
  const tempF = Math.round((weather.temp * 9) / 5 + 32);

  return {
    temp: weather.temp,
    tempF,
    condition: weather.condition,
    description: weather.description,
    isLoading,
    isAuthenticated: !!user,
  };
}
