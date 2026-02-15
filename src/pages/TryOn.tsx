import { useLocation } from "react-router-dom";
import AdvancedVirtualTryOn from "@/components/tryon/AdvancedVirtualTryOn";
import { PerfectCorpTryOn } from "@/components/sponsors";
import type { SelectedGarment } from "@/components/sponsors";
import { useWardrobe } from "@/hooks/useWardrobe";
import { DEMO_WARDROBE } from "@/lib/data";

interface TryOnLocationState {
  garmentIds?: string[];
}

const TryOn = () => {
  const location = useLocation();
  const state = location.state as TryOnLocationState | null;
  const initialGarmentIds = state?.garmentIds;
  const { items: apiItems, isAuthenticated } = useWardrobe();
  const wardrobeItems = isAuthenticated ? apiItems : DEMO_WARDROBE;
  const availableGarments: SelectedGarment[] = wardrobeItems.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl || (item as { image?: string }).image || "",
    category: item.category || "top",
    color: item.color,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">
          Virtual Try-On
        </h1>
        <p className="text-muted-foreground mt-1">
          See how clothes look on you with AI-powered virtual try-on.
        </p>
      </div>
      <AdvancedVirtualTryOn initialGarmentIds={initialGarmentIds} />
      <section>
        <PerfectCorpTryOn availableGarments={availableGarments} />
      </section>
    </div>
  );
};

export default TryOn;
