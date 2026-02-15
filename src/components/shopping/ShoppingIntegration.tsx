import { useState } from "react";
import ScreenshotUploader from "./ScreenshotUploader";
import CompatibilityScore from "./CompatibilityScore";
import VirtualTryOnModal from "@/components/outfit/VirtualTryOnModal";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useRecommendation, type DailyOutfit } from "@/hooks/useRecommendation";
import { DEMO_WARDROBE } from "@/lib/data";

const ShoppingIntegration = () => {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<{
    score: number;
    recommendations: DailyOutfit[];
    attributes?: Record<string, string>;
  } | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<DailyOutfit | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { items: wardrobeItems, isAuthenticated } = useWardrobe();
  const { analyzeCompatibility } = useRecommendation();
  const wardrobe = isAuthenticated ? wardrobeItems : DEMO_WARDROBE;

  const handleUpload = async (file: File) => {
    setScreenshot(file);
    setAnalysis(null);
    setAnalyzing(true);
    try {
      const result = await analyzeCompatibility(file, wardrobe);
      setAnalysis(result);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleTryOn = (outfit: DailyOutfit) => {
    setSelectedOutfit(outfit);
    setShowTryOn(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display gradient-text">Shopping Assistant</h2>
        <p className="text-muted-foreground mt-1">
          Upload a screenshot of an item you&apos;re considering. We&apos;ll analyze how it matches your wardrobe.
        </p>
      </div>
      <ScreenshotUploader onUpload={handleUpload} />
      {analyzing && (
        <p className="text-sm text-muted-foreground text-center py-4">Analyzing compatibility...</p>
      )}
      {analysis && !analyzing && (
        <CompatibilityScore
          score={analysis.score}
          recommendations={analysis.recommendations}
          onTryOn={handleTryOn}
        />
      )}
      {showTryOn && selectedOutfit && (
        <VirtualTryOnModal
          outfit={selectedOutfit}
          onClose={() => setShowTryOn(false)}
          open={showTryOn}
        />
      )}
    </div>
  );
};

export default ShoppingIntegration;
