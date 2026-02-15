import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Shirt,
  Sparkles,
  TrendingUp,
  Check,
  Palette,
  Ruler,
  Upload,
  ThumbsUp,
  ThumbsDown,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { AuthDialog } from "@/components/AuthDialog";
import { DEMO_WARDROBE, DEMO_TRENDS, type ClothingItem } from "@/lib/data";

const STYLE_COLORS = ["Black", "White", "Navy", "Gray", "Beige", "Brown", "Burgundy", "Olive", "Pastels", "Bright"];
const STYLE_PATTERNS = ["Solid", "Stripes", "Plaid", "Floral", "Abstract", "Minimal", "Bold prints"];
const STYLE_SILHOUETTES = ["Fitted", "Oversized", "Relaxed", "Structured", "Flowy", "Athleisure"];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedSilhouettes, setSelectedSilhouettes] = useState<string[]>([]);
  const [heightCm, setHeightCm] = useState("");
  const [skipMeasurements, setSkipMeasurements] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [firstOutfit, setFirstOutfit] = useState<{ items: ClothingItem[]; desc: string } | null>(null);
  const [ratedOutfit, setRatedOutfit] = useState<"like" | "dislike" | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    setStylePreferences,
    setBodyMeasurements,
    setUploadedCount,
    completeOnboarding,
  } = useOnboarding();

  const totalSteps = 7;
  const isLastStep = step === totalSteps - 1;

  const next = () => {
    if (step === 1 && !user) {
      setAuthOpen(true);
      return;
    }
    if (step === 2) {
      setStylePreferences({
        colors: selectedColors,
        patterns: selectedPatterns,
        silhouettes: selectedSilhouettes,
      });
    }
    if (step === 3) {
      if (!skipMeasurements && heightCm) {
        setBodyMeasurements({ heightCm: parseFloat(heightCm), optional: true });
      } else {
        setBodyMeasurements(null);
      }
    }
    if (step === 4) {
      setUploadedCount(uploadedFiles.length);
    }
    if (step === 5 && !firstOutfit) {
      // Generate first outfit (called from button, not from next)
      return;
    }
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      completeOnboarding();
      navigate("/outfits");
    }
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const toggleMulti = (
    arr: string[],
    setter: (a: string[]) => void,
    item: string,
    max = 5
  ) => {
    if (arr.includes(item)) {
      setter(arr.filter((x) => x !== item));
    } else if (arr.length < max) {
      setter([...arr, item]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 20);
    setUploadedFiles((prev) => [...prev, ...files].slice(0, 20));
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRate = (rating: "like" | "dislike") => {
    setRatedOutfit(rating);
    setTimeout(() => next(), 600);
  };

  const generateFirstOutfit = () => {
    const items = DEMO_WARDROBE.slice(0, 3);
    const trend = DEMO_TRENDS[Math.floor(Math.random() * DEMO_TRENDS.length)];
    setFirstOutfit({
      items,
      desc: `A relaxed look combining ${items.map((i) => i.name).join(", ")}. The ${trend.name.toLowerCase()} vibe ties it all together.`,
    });
  };

  const canProceed =
    (step === 2 && (selectedColors.length > 0 || selectedPatterns.length > 0 || selectedSilhouettes.length > 0)) ||
    (step === 3 && (skipMeasurements || !heightCm || (parseFloat(heightCm) >= 100 && parseFloat(heightCm) <= 250))) ||
    (step === 4 && uploadedFiles.length > 0) ||
    (step === 5 && firstOutfit != null) ||
    (step === 6 && ratedOutfit != null) ||
    (step === 0 || step === 1);

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Shirt size={40} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display gradient-text">Welcome to ClosetAI</h2>
              <p className="text-muted-foreground mt-2">
                Your intelligent wardrobe stylist. We&apos;ll personalize your experience in about 5 minutes.
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Check size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Create Your Account</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {user
                  ? `Signed in as ${user.email}`
                  : "Sign up with email or social login to save your wardrobe and get personalized recommendations."}
              </p>
            </div>
            {!user && (
              <Button variant="outline" onClick={() => setAuthOpen(true)} className="rounded-full">
                Sign up / Log in
              </Button>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Palette size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold font-display">Style Preferences</h2>
              <p className="text-muted-foreground text-sm mt-1">Select what you love (helps AI tailor suggestions)</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Colors</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STYLE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleMulti(selectedColors, setSelectedColors, c)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedColors.includes(c) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Patterns</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STYLE_PATTERNS.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleMulti(selectedPatterns, setSelectedPatterns, p)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedPatterns.includes(p) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Silhouettes</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STYLE_SILHOUETTES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleMulti(selectedSilhouettes, setSelectedSilhouettes, s)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedSilhouettes.includes(s) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Ruler size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold font-display">Body Measurements (Optional)</h2>
              <p className="text-muted-foreground text-sm mt-1">Improve fit visualization in virtual try-on</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipMeasurements}
                onChange={(e) => setSkipMeasurements(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Skip for now</span>
            </label>
            {!skipMeasurements && (
              <div>
                <label className="text-sm font-medium">Height (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  placeholder="e.g. 170"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-card"
                />
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Upload size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold font-display">Initial Wardrobe Upload</h2>
              <p className="text-muted-foreground text-sm mt-1">Upload up to 20 clothing photos. AI will categorize them.</p>
            </div>
            <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground mt-1">{uploadedFiles.length}/20 photos</p>
            </label>
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold font-display">Your First AI Outfit</h2>
              <p className="text-muted-foreground text-sm mt-1">Based on your style preferences</p>
            </div>
            {firstOutfit ? (
              <div className="glass-card p-6 space-y-4">
                <div className="flex gap-2 justify-center flex-wrap">
                  {firstOutfit.items.map((item) => (
                    <div key={item.id} className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">{item.image}</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-center text-muted-foreground">{firstOutfit.desc}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Button onClick={generateFirstOutfit} className="rounded-full gap-2">
                  <Sparkles size={16} /> Generate Outfit
                </Button>
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <ThumbsUp size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Rate This Suggestion</h2>
              <p className="text-muted-foreground text-sm mt-1">Your feedback trains our recommendation engine</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant={ratedOutfit === "like" ? "default" : "outline"}
                size="lg"
                className="rounded-full gap-2"
                onClick={() => handleRate("like")}
              >
                <ThumbsUp size={20} /> Love it
              </Button>
              <Button
                variant={ratedOutfit === "dislike" ? "default" : "outline"}
                size="lg"
                className="rounded-full gap-2"
                onClick={() => handleRate("dislike")}
              >
                <ThumbsDown size={20} /> Not for me
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8 space-y-6"
          >
            {stepContent()}

            <div className="flex gap-2 justify-center">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step ? "bg-primary" : i < step ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              {step > 0 && (
                <Button variant="outline" onClick={prev} className="rounded-full gap-1">
                  <ChevronLeft size={16} /> Back
                </Button>
              )}
              {step === 0 && (
                <Button variant="ghost" onClick={() => { completeOnboarding(); navigate("/"); }} className="rounded-full gap-1 text-muted-foreground">
                  <SkipForward size={16} /> Skip onboarding
                </Button>
              )}
              <Button
                onClick={next}
                disabled={step !== 0 && step !== 1 && !canProceed}
                className="rounded-full gap-1"
              >
                {isLastStep ? (
                  <>
                    Get Started <Check size={16} />
                  </>
                ) : (
                  <>
                    Next <ChevronRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Onboarding;
