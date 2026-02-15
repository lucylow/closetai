import { useLocation } from "react-router-dom";
import AdvancedVirtualTryOn from "@/components/tryon/AdvancedVirtualTryOn";

interface TryOnLocationState {
  garmentIds?: string[];
}

const TryOn = () => {
  const location = useLocation();
  const state = location.state as TryOnLocationState | null;
  const initialGarmentIds = state?.garmentIds;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">
          Virtual Try-On
        </h1>
        <p className="text-muted-foreground mt-1">
          See how clothes look on you with AI-powered virtual try-on.
        </p>
      </div>
      <AdvancedVirtualTryOn initialGarmentIds={initialGarmentIds} />
    </div>
  );
};

export default TryOn;
