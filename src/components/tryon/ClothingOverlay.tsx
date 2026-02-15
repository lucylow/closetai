import React from "react";
import { Loader2 } from "lucide-react";

interface ClothingOverlayProps {
  resultImage: string | null;
  isLoading?: boolean;
  alt?: string;
}

const ClothingOverlay = ({
  resultImage,
  isLoading = false,
  alt = "Virtual try-on result",
}: ClothingOverlayProps) => {
  if (isLoading) {
    return (
      <div className="tryon-result loading">
        <Loader2 className="animate-spin size-8 text-primary" />
        <p>Applying virtual try-on…</p>
      </div>
    );
  }
  if (!resultImage) return null;

  return (
    <div className="tryon-result">
      <img
        src={resultImage}
        alt={alt}
        className="result-image"
      />
    </div>
  );
};

export default ClothingOverlay;
