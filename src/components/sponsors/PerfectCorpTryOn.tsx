import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { usePerfectCorp } from "@/hooks/usePerfectCorp";
import { getImageUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import "./PerfectCorpTryOn.css";

export interface SelectedGarment {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  color?: string;
}

interface PerfectCorpTryOnProps {
  selectedGarment?: SelectedGarment | null;
  availableGarments?: SelectedGarment[];
}

const PerfectCorpTryOn: React.FC<PerfectCorpTryOnProps> = ({
  selectedGarment: initialGarment,
  availableGarments = [],
}) => {
  const [modelImage, setModelImage] = useState<Blob | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<SelectedGarment | null>(
    initialGarment ?? null
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    virtualTryOn,
    generateImage,
    loading,
    error,
    lastUrl,
    clearError,
  } = usePerfectCorp();

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Could not access camera");
    }
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture photo from camera
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            setModelImage(blob);
            toast.success("Photo captured");
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setModelImage(file);
      toast.success("Photo uploaded");
    }
    e.target.value = "";
  };

  // Call virtual try-on API
  const handleTryOn = async () => {
    if (!modelImage || !selectedGarment) {
      toast.error("Please capture a photo and select a garment");
      return;
    }
    setResultImage(null);
    clearError();
    try {
      const res = await fetch(getImageUrl(selectedGarment.imageUrl) || selectedGarment.imageUrl);
      const garmentBlob = await res.blob();
      const result = await virtualTryOn(
        modelImage,
        garmentBlob,
        selectedGarment.category,
        "standard"
      );

      if (typeof result === "object" && "url" in result && result.url) {
        setResultImage(result.url);
      } else if (result instanceof Blob) {
        setResultImage(URL.createObjectURL(result));
      } else if (lastUrl) {
        setResultImage(lastUrl);
      }
      toast.success("Try-on complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Try-on failed");
    }
  };

  // Generate AI styled image via Perfect Corp
  const handleGenerateImage = async () => {
    const garment = selectedGarment;
    if (!garment) {
      toast.error("Please select a garment first");
      return;
    }
    setAiImage(null);
    clearError();
    try {
      const prompt = `A stylish outfit with a ${garment.color || "elegant"} ${garment.category}, photorealistic fashion photography`;
      const data = await generateImage(prompt, "photorealistic");
      const url = data.url || data.generatedImageUrl;
      if (url) {
        setAiImage(url);
        toast.success("AI image generated!");
      } else {
        toast.error("No image URL returned");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    }
  };

  const garments =
    availableGarments.length > 0 ? availableGarments : selectedGarment ? [selectedGarment] : [];

  return (
    <div className="perfect-corp-tryon">
      <h3 className="perfect-corp-title">
        <Sparkles size={20} />
        Perfect Corp Virtual Try-On
      </h3>

      {error && (
        <div className="perfect-corp-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={clearError} className="perfect-corp-error-dismiss">
            Dismiss
          </button>
        </div>
      )}

      <div className="tryon-layout">
        <div className="camera-section">
          {!modelImage ? (
            <>
              <div className="camera-controls">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="gap-2"
                >
                  <Camera size={18} />
                  Start Camera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload size={18} />
                  Upload Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} className="hidden" />
              {videoRef.current?.srcObject && (
                <Button type="button" onClick={capturePhoto} className="mt-2">
                  Capture
                </Button>
              )}
            </>
          ) : (
            <div className="captured-section">
              <img
                src={URL.createObjectURL(modelImage)}
                alt="Captured"
                className="captured-preview"
              />
              <div className="captured-actions">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setModelImage(null);
                    setResultImage(null);
                  }}
                >
                  Retake
                </Button>
                <Button
                  type="button"
                  onClick={handleTryOn}
                  disabled={loading || !selectedGarment}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>👗 Try This Garment</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="result-section">
          {garments.length > 0 && (
            <div className="garment-picker">
              <p className="text-sm text-muted-foreground mb-2">Select garment:</p>
              <div className="garment-chips">
                {garments.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`garment-chip ${selectedGarment?.id === g.id ? "selected" : ""}`}
                    onClick={() => setSelectedGarment(g)}
                  >
                    <img src={getImageUrl(g.imageUrl) || g.imageUrl} alt={g.name} />
                    <span>{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {resultImage && (
            <div className="result-block">
              <h4>Try-On Result</h4>
              <img src={resultImage} alt="Try-on" className="result-image" />
              <a
                href={resultImage}
                target="_blank"
                rel="noreferrer"
                className="result-link"
              >
                <ExternalLink size={14} />
                Open in new tab
              </a>
            </div>
          )}
          {aiImage && (
            <div className="result-block">
              <h4>AI Styled Image</h4>
              <img src={aiImage} alt="AI styled" className="result-image" />
              <a href={aiImage} target="_blank" rel="noreferrer" className="result-link">
                <ExternalLink size={14} />
                Open in new tab
              </a>
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerateImage}
            disabled={loading || !selectedGarment}
            className="gap-2 mt-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>🎨 Generate AI Styled Image</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PerfectCorpTryOn;
