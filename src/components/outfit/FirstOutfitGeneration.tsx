import { useState, useEffect } from "react";
import OutfitCard from "./OutfitCard";
import RatingStars from "./RatingStars";
import VirtualTryOnModal from "./VirtualTryOnModal";
import { Button } from "@/components/ui/button";
import { useRecommendation, type DailyOutfit } from "@/hooks/useRecommendation";
import { useWardrobe } from "@/hooks/useWardrobe";
import { DEMO_WARDROBE } from "@/lib/data";
import { ChevronLeft } from "lucide-react";

interface FirstOutfitGenerationProps {
  onNext: (data: { ratedOutfits: DailyOutfit[] }) => void;
  onBack: () => void;
}

const FirstOutfitGeneration = ({ onNext, onBack }: FirstOutfitGenerationProps) => {
  const [outfits, setOutfits] = useState<DailyOutfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<DailyOutfit | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);
  const { getInitialOutfits, rateOutfit } = useRecommendation();
  const { items: wardrobeItems, isAuthenticated } = useWardrobe();
  const wardrobe = isAuthenticated ? wardrobeItems : DEMO_WARDROBE;

  useEffect(() => {
    const fetchOutfits = async () => {
      const initial = await getInitialOutfits(wardrobe, 3);
      setOutfits(initial);
    };
    fetchOutfits();
  }, [wardrobe.length, getInitialOutfits]);

  const handleRate = (outfitId: string, rating: number) => {
    rateOutfit(outfitId, rating);
    setOutfits((prev) =>
      prev.map((o) => (o.id === outfitId ? { ...o, userRating: rating } : o))
    );
  };

  const handleTryOn = (outfit: DailyOutfit) => {
    setSelectedOutfit(outfit);
    setShowTryOn(true);
  };

  const handleTryOnClose = () => {
    setShowTryOn(false);
    setSelectedOutfit(null);
  };

  const handleContinue = () => {
    onNext({ ratedOutfits: outfits });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold font-display">Your first outfit suggestions</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Rate these outfits to help us learn your style
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {outfits.map((outfit) => (
          <OutfitCard key={outfit.id} outfit={outfit}>
            <div className="flex flex-col gap-2">
              <RatingStars
                initialRating={outfit.userRating}
                onRate={(r) => handleRate(outfit.id, r)}
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => handleTryOn(outfit)}
              >
                Virtual Try-On
              </Button>
            </div>
          </OutfitCard>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-full gap-1">
          <ChevronLeft size={16} /> Back
        </Button>
        <Button onClick={handleContinue} className="rounded-full">
          Continue to Dashboard
        </Button>
      </div>
      {showTryOn && selectedOutfit && (
        <VirtualTryOnModal
          outfit={selectedOutfit}
          onClose={handleTryOnClose}
          open={showTryOn}
        />
      )}
    </div>
  );
};

export default FirstOutfitGeneration;
