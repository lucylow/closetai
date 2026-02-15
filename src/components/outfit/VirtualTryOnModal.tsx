import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePerfectCorp } from "@/hooks/usePerfectCorp";
import type { DailyOutfit } from "@/hooks/useRecommendation";
import { Loader2 } from "lucide-react";

interface VirtualTryOnModalProps {
  outfit: DailyOutfit;
  onClose: () => void;
  open?: boolean;
}

const VirtualTryOnModal = ({ outfit, onClose, open = true }: VirtualTryOnModalProps) => {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const { virtualTryOn, loading, error } = usePerfectCorp();

  const handleTryOn = async () => {
    try {
      // Use a placeholder user photo for demo (in production, fetch from user profile)
      const placeholderUserUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=user";
      const userPhotoRes = await fetch(placeholderUserUrl);
      const userPhoto = await userPhotoRes.blob();

      const garmentItem = outfit.items[0];
      if (!garmentItem?.imageUrl) {
        setResultImage(placeholderUserUrl);
        return;
      }
      const garmentRes = await fetch(garmentItem.imageUrl);
      const garmentBlob = await garmentRes.blob();

      const result = await virtualTryOn(
        userPhoto,
        garmentBlob,
        garmentItem.extractedAttributes?.category || "top"
      );

      if (result instanceof Blob) {
        setResultImage(URL.createObjectURL(result));
      } else if (typeof result === "object" && result?.url) {
        setResultImage(result.url);
      }
    } catch {
      // Fallback: show outfit preview
      setResultImage(outfit.items[0]?.imageUrl || null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Virtual Try-On</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!resultImage && !loading && (
            <Button
              onClick={handleTryOn}
              className="w-full rounded-full gap-2"
            >
              Start Try-On
            </Button>
          )}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing your try-on...</p>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {resultImage && (
            <img
              src={resultImage}
              alt="Try-on result"
              className="w-full rounded-xl object-cover max-h-80"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualTryOnModal;
