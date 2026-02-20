import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type StylePreferences = {
  colors: string[];
  patterns: string[];
  silhouettes: string[];
};

export type BodyMeasurements = {
  heightCm?: number;
  optional: boolean;
};

type OnboardingContextType = {
  isComplete: boolean;
  currentStep: number;
  stylePreferences: StylePreferences;
  bodyMeasurements: BodyMeasurements | null;
  uploadedCount: number;
  setStylePreferences: (prefs: Partial<StylePreferences>) => void;
  setBodyMeasurements: (m: BodyMeasurements | null) => void;
  setUploadedCount: (n: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
};

const STORAGE_KEY = "closetai_onboarding_complete";

const defaultPrefs: StylePreferences = {
  colors: [],
  patterns: [],
  silhouettes: [],
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isComplete, setIsComplete] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [stylePreferences, setStylePrefsState] = useState<StylePreferences>(defaultPrefs);
  const [bodyMeasurements, setBodyMeasurementsState] = useState<BodyMeasurements | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const setStylePreferences = useCallback((prefs: Partial<StylePreferences>) => {
    setStylePrefsState((prev) => ({ ...prev, ...prefs }));
  }, []);

  const setBodyMeasurements = useCallback((m: BodyMeasurements | null) => {
    setBodyMeasurementsState(m);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsComplete(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    setIsComplete(false);
    setCurrentStep(0);
    setStylePrefsState(defaultPrefs);
    setBodyMeasurementsState(null);
    setUploadedCount(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isComplete,
        currentStep,
        stylePreferences,
        bodyMeasurements,
        uploadedCount,
        setStylePreferences,
        setBodyMeasurements,
        setUploadedCount,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
