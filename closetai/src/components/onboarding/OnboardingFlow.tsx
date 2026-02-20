import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import WardrobeUploadFlow from "@/components/wardrobe/WardrobeUploadFlow";
import FirstOutfitGeneration from "@/components/outfit/FirstOutfitGeneration";
import { Button } from "@/components/ui/button";
import StyleQuiz from "./StyleQuiz";
import Measurements from "./Measurements";

const STEPS = ["Account", "Style Quiz", "Measurements", "Upload Wardrobe", "First Outfit"] as const;

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [userData, setUserData] = useState<Record<string, unknown>>({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    setStylePreferences,
    setBodyMeasurements,
    setUploadedCount,
    completeOnboarding,
  } = useOnboarding();

  const handleNext = (data?: Record<string, unknown>) => {
    const newData = { ...userData, ...data };
    setUserData(newData);

    if (currentStep === 1 && data?.stylePrefs) {
      setStylePreferences(data.stylePrefs as { colors: string[]; patterns: string[]; silhouettes: string[] });
    }
    if (currentStep === 2 && data?.measurements !== undefined) {
      const m = data.measurements as { height?: string } | null;
      setBodyMeasurements(
        m && m.height
          ? { heightCm: parseFloat(m.height), optional: true }
          : null
      );
    }
    if (currentStep === 3 && data?.wardrobe) {
      setUploadedCount((data.wardrobe as unknown[]).length);
    }

    if (currentStep === STEPS.length - 1) {
      completeOnboarding();
      navigate("/dashboard");
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(0, s - 1));

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-xl font-bold font-display">Create your account</h2>
            <p className="text-muted-foreground text-sm">
              {user ? `Signed in as ${user.email}` : "Sign up to save your wardrobe and get personalized recommendations."}
            </p>
            {!user && (
              <Button variant="outline" onClick={() => setAuthOpen(true)} className="rounded-full">
                Sign up / Log in
              </Button>
            )}
            {user && (
              <Button onClick={() => handleNext({ userId: user.id })} className="rounded-full">
                Continue
              </Button>
            )}
          </div>
        );
      case 1:
        return (
          <StyleQuiz
            onNext={(prefs) => handleNext({ stylePrefs: prefs })}
            onBack={handleBack}
            initialData={userData}
          />
        );
      case 2:
        return (
          <Measurements
            onNext={(m) => handleNext({ measurements: m })}
            onBack={handleBack}
            initialData={userData}
          />
        );
      case 3:
        return <WardrobeUploadFlow onNext={(d) => handleNext(d)} onBack={handleBack} />;
      case 4:
        return <FirstOutfitGeneration onNext={(d) => handleNext(d)} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-lg">
        <div className="flex justify-between mb-6">
          {STEPS.map((label, idx) => (
            <div
              key={label}
              className={`flex flex-col items-center ${idx <= currentStep ? "opacity-100" : "opacity-50"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {idx + 1}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default OnboardingFlow;
