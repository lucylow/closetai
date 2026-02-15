import { Button } from "@/components/ui/button";
import type { DailyOutfit } from "@/hooks/useRecommendation";

interface CompatibilityScoreProps {
  score: number;
  recommendations: DailyOutfit[];
  onTryOn: (outfit: DailyOutfit) => void;
}

const CompatibilityScore = ({ score, recommendations, onTryOn }: CompatibilityScoreProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center p-6 rounded-2xl bg-primary/10 border border-primary/20">
        <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}%</span>
        </div>
        <p className="text-sm font-medium mt-2">match with your style</p>
      </div>
      <div>
        <h3 className="font-semibold mb-3">Try these combinations</h3>
        <div className="space-y-2">
          {recommendations.map((outfit) => (
            <div
              key={outfit.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
            >
              <span className="text-sm line-clamp-1">{outfit.description}</span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full shrink-0 ml-2"
                onClick={() => onTryOn(outfit)}
              >
                Try On
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompatibilityScore;
