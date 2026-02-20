import { useState } from "react";
import { Button } from "@/components/ui/button";

const STYLE_OPTIONS = {
  colors: ["Neutral", "Bold", "Pastel", "Earth tones"],
  patterns: ["Solid", "Striped", "Floral", "Plaid", "Geometric"],
  silhouettes: ["Fitted", "Oversized", "A-line", "Tailored"],
} as const;

type StylePrefs = {
  colors: string[];
  patterns: string[];
  silhouettes: string[];
};

interface StyleQuizProps {
  onNext: (prefs: StylePrefs) => void;
  onBack: () => void;
  initialData?: Record<string, unknown>;
}

const StyleQuiz = ({ onNext, onBack, initialData }: StyleQuizProps) => {
  const [preferences, setPreferences] = useState<StylePrefs>(
    (initialData?.stylePrefs as StylePrefs) || {
      colors: [],
      patterns: [],
      silhouettes: [],
    }
  );

  const toggleSelection = (category: keyof StylePrefs, value: string) => {
    setPreferences((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleSubmit = () => {
    onNext(preferences);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-display text-center">
        Tell us your style preferences
      </h2>
      {Object.entries(STYLE_OPTIONS).map(([category, options]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
            {category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <Button
                key={opt}
                type="button"
                variant={
                  preferences[category as keyof StylePrefs]?.includes(opt)
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="rounded-full"
                onClick={() =>
                  toggleSelection(category as keyof StylePrefs, opt)
                }
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} className="rounded-full">
          Back
        </Button>
        <Button onClick={handleSubmit} className="rounded-full">
          Next
        </Button>
      </div>
    </div>
  );
};

export default StyleQuiz;
