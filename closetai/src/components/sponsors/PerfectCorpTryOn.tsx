import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, Loader2, ExternalLink, AlertCircle, RefreshCw, WifiOff, Star, Image, Palette } from "lucide-react";
import { usePerfectCorp } from "@/hooks/usePerfectCorp";
import { getImageUrl } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { demoVirtualTryOnGallery, demoAIGeneratedOutfits, demoAPIStats } from "@/mocks/youcam";
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
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [lastFailedAction, setLastFailedAction] = useState<"tryon" | "generate" | null>(null);
  const [activeTab, setActiveTab] = useState<"tryon" | "gallery" | "ai">("tryon");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    virtualTryOn,
    generateImage,
    loading,
    error,
    errorDetails,
    lastUrl,
    clearError,
  } = usePerfectCorp();

  const startCamera = async () => {
    setTryOnError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access was denied. Please allow camera access in your browser settings, or upload a photo instead."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No camera found on this device. Please upload a photo instead."
            : "Could not access camera. Try uploading a photo instead.";
      setTryOnError(msg);
      setCanRetry(false);
      toast.error(msg);
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
            setTryOnError(null);
            toast.success("Photo captured");
          } else {
            setTryOnError("Failed to capture photo. Please try again.");
            toast.error("Failed to capture photo");
          }
        }, "image/jpeg", 0.9);
      }
    } else {
      toast.error("Camera is not ready. Please start the camera first.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, etc.)");
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image is too large. Please use an image under 10MB.");
      e.target.value = "";
      return;
    }

    setModelImage(file);
    setTryOnError(null);
    toast.success("Photo uploaded");
    e.target.value = "";
  };

  const handleTryOn = async () => {
    if (!modelImage || !selectedGarment) {
      toast.error("Please capture a photo and select a garment");
      return;
    }
    setResultImage(null);
    setTryOnError(null);
    setCanRetry(false);
    setLastFailedAction(null);
    clearError();

    try {
      let garmentBlob: Blob;
      try {
        const imageUrl = getImageUrl(selectedGarment.imageUrl) || selectedGarment.imageUrl;
        const res = await fetch(imageUrl);
        if (!res.ok) {
          throw new Error(`Image load failed (${res.status})`);
        }
        garmentBlob = await res.blob();
      } catch (fetchErr) {
        const msg = `Could not load the garment image for "${selectedGarment.name}". The image may be unavailable.`;
        setTryOnError(msg);
        setCanRetry(true);
        setLastFailedAction("tryon");
        toast.error(msg);
        return;
      }

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
      const msg = errorDetails?.message
        || (err instanceof Error ? err.message : "Try-on failed. Please try again.");
      setTryOnError(msg);
      setCanRetry(errorDetails?.retryable !== false);
      setLastFailedAction("tryon");
      toast.error(msg);
    }
  };

  const handleGenerateImage = async () => {
    const garment = selectedGarment;
    if (!garment) {
      toast.error("Please select a garment first");
      return;
    }
    setAiImage(null);
    setTryOnError(null);
    setCanRetry(false);
    setLastFailedAction(null);
    clearError();
    try {
      const prompt = `A stylish outfit with a ${garment.color || "elegant"} ${garment.category}, photorealistic fashion photography`;
      const data = await generateImage(prompt, "photorealistic");
      const url = data.url || data.generatedImageUrl;
      if (url) {
        setAiImage(url);
        toast.success("AI image generated!");
      } else {
        setTryOnError("No image was returned from the AI service. Please try again.");
        setCanRetry(true);
        setLastFailedAction("generate");
        toast.error("No image URL returned");
      }
    } catch (err) {
      const msg = errorDetails?.message
        || (err instanceof Error ? err.message : "AI generation failed. Please try again.");
      setTryOnError(msg);
      setCanRetry(errorDetails?.retryable !== false);
      setLastFailedAction("generate");
      toast.error(msg);
    }
  };

  const handleRetry = () => {
    if (lastFailedAction === "generate") {
      handleGenerateImage();
    } else {
      handleTryOn();
    }
  };

  const dismissError = () => {
    setTryOnError(null);
    setCanRetry(false);
    setLastFailedAction(null);
    clearError();
  };

  const garments =
    availableGarments.length > 0 ? availableGarments : selectedGarment ? [selectedGarment] : [];

  const displayError = tryOnError || error;
  const isNetworkError = errorDetails?.type === "network";

  return (
    <div className="perfect-corp-tryon">
      <h3 className="perfect-corp-title">
        <Sparkles size={20} />
        Perfect Corp Virtual Try-On
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
          YouCam AI
        </span>
      </h3>

      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("tryon")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "tryon" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Camera size={14} className="inline mr-1.5" />
          Try-On
        </button>
        <button
          onClick={() => setActiveTab("gallery")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "gallery" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Image size={14} className="inline mr-1.5" />
          Gallery
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "ai" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Palette size={14} className="inline mr-1.5" />
          AI Outfits
        </button>
      </div>

      {displayError && (
        <div className="perfect-corp-error" role="alert">
          {isNetworkError ? <WifiOff size={18} /> : <AlertCircle size={18} />}
          <div className="perfect-corp-error-body">
            <span>{displayError}</span>
            <div className="perfect-corp-error-actions">
              {canRetry && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading}
                  className="perfect-corp-retry-btn"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              )}
              <button type="button" onClick={dismissError} className="perfect-corp-error-dismiss">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tryon" && (
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
                      setTryOnError(null);
                      clearError();
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
                      <>
                        <Sparkles size={16} />
                        Try This Garment
                      </>
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
                      <img
                        src={getImageUrl(g.imageUrl) || g.imageUrl}
                        alt={g.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/48x48/6e4ae0/white?text=${encodeURIComponent(g.name.slice(0, 2))}`;
                        }}
                      />
                      <span>{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {resultImage && (
              <div className="result-block">
                <h4>Try-On Result</h4>
                <img
                  src={resultImage}
                  alt="Try-on"
                  className="result-image"
                  onError={() => {
                    setTryOnError("The result image could not be loaded. Please try again.");
                    setCanRetry(true);
                    setResultImage(null);
                  }}
                />
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
                <img
                  src={aiImage}
                  alt="AI styled"
                  className="result-image"
                  onError={() => {
                    toast.error("AI image could not be displayed");
                    setAiImage(null);
                  }}
                />
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
                <>
                  <Palette size={16} />
                  Generate AI Styled Image
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {activeTab === "gallery" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Recent virtual try-on results powered by Perfect Corp AI</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {demoVirtualTryOnGallery.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/50 overflow-hidden bg-card">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={item.resultImage} alt={item.garment} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{item.garment}</span>
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">Fit: {item.fitScore}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.styleNotes}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/50">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{demoAPIStats.tryOnRequests}</div>
              <div className="text-xs text-muted-foreground">Try-ons Today</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{demoAPIStats.avgResponseTime}</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{demoAPIStats.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{demoAPIStats.creditsRemaining.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Credits Left</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">AI-generated outfit images from your wardrobe items</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {demoAIGeneratedOutfits.map((outfit) => (
              <div key={outfit.id} className="rounded-xl border border-border/50 overflow-hidden bg-card">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={outfit.imageUrl} alt={outfit.prompt} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{outfit.occasion}</span>
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{outfit.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {outfit.items.map((item, idx) => (
                      <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{item}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">{outfit.style}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-muted/50">
            <h4 className="text-sm font-semibold mb-2">API Endpoint Status</h4>
            <div className="space-y-1.5">
              {demoAPIStats.endpoints.map((ep) => (
                <div key={ep.path} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-mono">{ep.method} {ep.path}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{ep.calls} calls</span>
                    <span>{ep.avgLatency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfectCorpTryOn;
