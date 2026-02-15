import React, { useState, useRef, useEffect } from "react";
import { Ruler } from "lucide-react";
import { usePerfectCorp } from "@/hooks/usePerfectCorp";
import { useWardrobe } from "@/hooks/useWardrobe";
import { getImageUrl } from "@/lib/api";
import { DEMO_WARDROBE } from "@/lib/data";
import {
  formatMeasurement,
  getSizeSuggestion,
  type BodyMeasurements,
} from "@/utils/measurementHelper";
import { toast } from "sonner";
import CameraView from "./CameraView";
import ClothingOverlay from "./ClothingOverlay";
import ShareButton from "./ShareButton";
import "./AdvancedVirtualTryOn.css";

interface Garment {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
}

function toGarment(item: {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  category: string;
}): Garment {
  const url =
    item.imageUrl || (item.image?.startsWith("http") ? item.image : undefined);
  return {
    id: item.id,
    name: item.name,
    imageUrl: url
      ? getImageUrl(url)
      : `https://placehold.co/80x80/6e4ae0/white?text=${encodeURIComponent(item.name.slice(0, 2))}`,
    category: item.category,
  };
}

interface AdvancedVirtualTryOnProps {
  initialGarmentIds?: string[];
}

const AdvancedVirtualTryOn = ({ initialGarmentIds }: AdvancedVirtualTryOnProps) => {
  const { items: apiItems, isAuthenticated } = useWardrobe();
  const wardrobeItems = isAuthenticated ? apiItems : DEMO_WARDROBE;
  const availableGarments: Garment[] = wardrobeItems.map(toGarment);
  const { virtualTryOn, estimateMeasurements, shareTryOn } = usePerfectCorp();

  const [userPhoto, setUserPhoto] = useState<Blob | null>(null);
  const [selectedGarments, setSelectedGarments] = useState<Garment[]>([]);

  const appliedInitial = useRef(false);
  useEffect(() => {
    if (appliedInitial.current || !initialGarmentIds?.length || !availableGarments.length) return;
    const matched = availableGarments.filter((g) => initialGarmentIds.includes(g.id));
    if (matched.length) {
      setSelectedGarments(matched);
      appliedInitial.current = true;
    }
  }, [initialGarmentIds, availableGarments]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [showMeasurePanel, setShowMeasurePanel] = useState(false);

  const handleCapture = async (blob: Blob) => {
    setUserPhoto(blob);
    toast.success("Photo added");
    try {
      const data = await estimateMeasurements(blob);
      setMeasurements(data);
    } catch {
      // Proceed without measurements
    }
  };

  const handleEstimateMeasurements = async () => {
    if (!userPhoto) return;
    try {
      const data = await estimateMeasurements(userPhoto);
      setMeasurements(data);
      toast.success("Measurements estimated!");
    } catch {
      toast.error("Measurement estimation failed");
    }
  };

  const handleTryOn = async () => {
    if (!userPhoto || selectedGarments.length === 0) return;
    setLoading(true);
    setResultImage(null);
    setResultBlob(null);
    try {
      let currentImage = userPhoto;
      for (const garment of selectedGarments) {
        const res = await fetch(garment.imageUrl);
        const garmentBlob = await res.blob();
        currentImage = await virtualTryOn(
          currentImage,
          garmentBlob,
          garment.category
        );
      }
      setResultBlob(currentImage);
      setResultImage(URL.createObjectURL(currentImage));
    } catch {
      toast.error("Try-on failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleGarment = (garment: Garment) => {
    setSelectedGarments((prev) =>
      prev.find((g) => g.id === garment.id)
        ? prev.filter((g) => g.id !== garment.id)
        : [...prev, garment]
    );
  };

  return (
    <div className="advanced-tryon">
      <div className="tryon-layout">
        <div className="camera-section">
          <CameraView
            onCapture={handleCapture}
            capturedPreview={userPhoto}
            onRetake={() => {
              setUserPhoto(null);
              setMeasurements(null);
            }}
          />
          {userPhoto && (
            <button
              type="button"
              className="tryon-btn tryon-btn-inline"
              onClick={handleTryOn}
              disabled={
                loading || !userPhoto || selectedGarments.length === 0
              }
            >
              {loading ? "Processing…" : "✨ Try this outfit"}
            </button>
          )}
        </div>

        <div className="garment-selector">
          <h3>Select garments from your wardrobe</h3>
          <div className="garment-list">
            {availableGarments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Add items to your wardrobe first to try them on.
              </p>
            ) : (
              availableGarments.map((g) => (
                <div
                  key={g.id}
                  role="button"
                  tabIndex={0}
                  className={`garment-item ${selectedGarments.some((sg) => sg.id === g.id) ? "selected" : ""}`}
                  onClick={() => toggleGarment(g)}
                  onKeyDown={(e) => e.key === "Enter" && toggleGarment(g)}
                >
                  <img src={g.imageUrl} alt={g.name} />
                  <span>{g.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="measurement-section">
          <button
            type="button"
            onClick={() => setShowMeasurePanel(!showMeasurePanel)}
            className="measure-toggle"
          >
            <Ruler size={16} />
            {measurements ? "View measurements" : "Estimate measurements"}
          </button>
          {showMeasurePanel && (
            <div className="measure-panel">
              <button
                type="button"
                onClick={handleEstimateMeasurements}
                disabled={!userPhoto}
                className="estimate-btn"
              >
                Estimate from photo
              </button>
              {measurements && (
                <div className="measurements-display">
                  <div className="measure-grid">
                    <span>Height</span>
                    <span>{formatMeasurement(measurements.height)}</span>
                    <span>Weight</span>
                    <span>{formatMeasurement(measurements.weight, "kg")}</span>
                    <span>Bust</span>
                    <span>{formatMeasurement(measurements.bust ?? measurements.chest)}</span>
                    <span>Waist</span>
                    <span>{formatMeasurement(measurements.waist)}</span>
                    <span>Hips</span>
                    <span>{formatMeasurement(measurements.hips)}</span>
                  </div>
                  <p className="size-suggestion">
                    Suggested size: <strong>{getSizeSuggestion(measurements)}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="result-section">
        <ClothingOverlay
          resultImage={resultImage}
          isLoading={loading}
        />
        {resultBlob && (
          <ShareButton
            resultImageBlob={resultBlob}
            onShare={shareTryOn}
          />
        )}
      </div>
    </div>
  );
};

export default AdvancedVirtualTryOn;
