import React, { useState, useRef, useEffect } from "react";
import { Ruler, AlertTriangle, RefreshCw, WifiOff, CreditCard } from "lucide-react";
import { usePerfectCorp, type TryOnError } from "@/hooks/usePerfectCorp";
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

function ErrorIcon({ type }: { type?: string }) {
  switch (type) {
    case "network":
      return <WifiOff size={20} />;
    case "credits_exhausted":
      return <CreditCard size={20} />;
    default:
      return <AlertTriangle size={20} />;
  }
}

const AdvancedVirtualTryOn = ({ initialGarmentIds }: AdvancedVirtualTryOnProps) => {
  const { items: apiItems, isAuthenticated } = useWardrobe();
  const wardrobeItems = isAuthenticated ? apiItems : DEMO_WARDROBE;
  const availableGarments: Garment[] = wardrobeItems.map(toGarment);
  const { virtualTryOn, estimateMeasurements, shareTryOn, error, errorDetails, clearError } =
    usePerfectCorp();

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
  const [tryOnError, setTryOnError] = useState<TryOnError | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [showMeasurePanel, setShowMeasurePanel] = useState(false);

  const handleCapture = async (blob: Blob) => {
    setUserPhoto(blob);
    setTryOnError(null);
    clearError();
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
    if (!userPhoto || selectedGarments.length === 0) {
      toast.error("Please add a photo and select at least one garment");
      return;
    }
    setLoading(true);
    setResultImage(null);
    setResultBlob(null);
    setTryOnError(null);
    clearError();

    try {
      let currentImage: Blob = userPhoto;

      for (const garment of selectedGarments) {
        let garmentBlob: Blob;
        try {
          const res = await fetch(garment.imageUrl);
          if (!res.ok) {
            throw new Error(`Failed to load garment image (${res.status})`);
          }
          garmentBlob = await res.blob();
        } catch (fetchErr) {
          const errObj: TryOnError = {
            type: "garment_fetch",
            message: `Could not load image for "${garment.name}". The image may be unavailable or your connection is unstable.`,
            retryable: true,
          };
          setTryOnError(errObj);
          toast.error(errObj.message);
          return;
        }

        const result = await virtualTryOn(
          currentImage,
          garmentBlob,
          garment.category
        );

        if (result instanceof Blob) {
          currentImage = result;
        } else if (result && typeof result === "object" && "url" in result && result.url) {
          try {
            const imgRes = await fetch(result.url);
            if (imgRes.ok) {
              currentImage = await imgRes.blob();
            } else {
              const errObj: TryOnError = {
                type: "server_error",
                message: "The try-on result image could not be loaded. Please try again.",
                retryable: true,
              };
              setTryOnError(errObj);
              toast.error(errObj.message);
              return;
            }
          } catch {
            const errObj: TryOnError = {
              type: "network",
              message: "Could not download the try-on result. Please check your connection and try again.",
              retryable: true,
            };
            setTryOnError(errObj);
            toast.error(errObj.message);
            return;
          }
        } else if (result && typeof result === "object") {
          const errObj: TryOnError = {
            type: "server_error",
            message: "The try-on service returned an unexpected response. Please try again.",
            retryable: true,
          };
          setTryOnError(errObj);
          toast.error(errObj.message);
          return;
        }
      }

      setResultBlob(currentImage);
      setResultImage(URL.createObjectURL(currentImage));
      toast.success("Try-on complete!");
    } catch (err) {
      const fallback: TryOnError = errorDetails || {
        type: "unknown",
        message: err instanceof Error ? err.message : "Try-on failed. Please try again.",
        retryable: true,
      };
      setTryOnError(fallback);
      toast.error(fallback.message);
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

  const dismissError = () => {
    setTryOnError(null);
    clearError();
  };

  return (
    <div className="advanced-tryon">
      {tryOnError && (
        <div
          className={`tryon-error-banner ${tryOnError.type === "credits_exhausted" ? "tryon-error-warning" : "tryon-error-danger"}`}
          role="alert"
        >
          <div className="tryon-error-content">
            <ErrorIcon type={tryOnError.type} />
            <div className="tryon-error-text">
              <strong>
                {tryOnError.type === "network"
                  ? "Connection Error"
                  : tryOnError.type === "credits_exhausted"
                    ? "Credits Exhausted"
                    : tryOnError.type === "garment_fetch"
                      ? "Image Load Error"
                      : tryOnError.type === "timeout"
                        ? "Request Timeout"
                        : "Try-On Error"}
              </strong>
              <p>{tryOnError.message}</p>
            </div>
          </div>
          <div className="tryon-error-actions">
            {tryOnError.retryable && (
              <button
                type="button"
                className="tryon-retry-btn"
                onClick={handleTryOn}
                disabled={loading}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            )}
            <button type="button" className="tryon-dismiss-btn" onClick={dismissError}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="tryon-layout">
        <div className="camera-section">
          <CameraView
            onCapture={handleCapture}
            capturedPreview={userPhoto}
            onRetake={() => {
              setUserPhoto(null);
              setMeasurements(null);
              setTryOnError(null);
              clearError();
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
                  <img
                    src={g.imageUrl}
                    alt={g.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/80x80/6e4ae0/white?text=${encodeURIComponent(g.name.slice(0, 2))}`;
                    }}
                  />
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
