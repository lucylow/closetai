import OutfitCard from "@/components/outfit/OutfitCard";
import VirtualTryOnModal from "@/components/outfit/VirtualTryOnModal";
import { Button } from "@/components/ui/button";
import type { DailyOutfit } from "@/hooks/useRecommendation";
import { useState } from "react";

interface OutfitSuggestionsProps {
  outfits: DailyOutfit[];
  onTryOn: (outfit: DailyOutfit) => void;
  onSelect: (outfit: DailyOutfit) => void;
}

const OutfitSuggestions = ({ outfits, onTryOn, onSelect }: OutfitSuggestionsProps) => {
  const [selectedOutfit, setSelectedOutfit] = useState<DailyOutfit | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  const handleTryOn = (outfit: DailyOutfit) => {
    onTryOn(outfit);
    setSelectedOutfit(outfit);
    setShowTryOn(true);
  };

  const handleCloseTryOn = () => {
    setShowTryOn(false);
    setSelectedOutfit(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Today&apos;s Suggestions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {outfits.map((outfit) => (
          <OutfitCard key={outfit.id} outfit={outfit}>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full flex-1"
                onClick={() => handleTryOn(outfit)}
              >
                Try On
              </Button>
              <Button
                size="sm"
                className="rounded-full flex-1"
                onClick={() => onSelect(outfit)}
              >
                Select
              </Button>
            </div>
          </OutfitCard>
        ))}
      </div>
      {showTryOn && selectedOutfit && (
        <VirtualTryOnModal
          outfit={selectedOutfit}
          onClose={handleCloseTryOn}
          open={showTryOn}
        />
      )}
    </div>
  );
};

export default OutfitSuggestions;
