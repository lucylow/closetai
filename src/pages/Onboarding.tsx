import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Shirt, Sparkles, TrendingUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Welcome to ClosetAI",
    description: "Your intelligent wardrobe stylist. We'll help you organize, style, and get the most from your clothes.",
    icon: Shirt,
  },
  {
    title: "AI-Powered Styling",
    description: "Get outfit recommendations based on your wardrobe, occasion, and current fashion trends.",
    icon: Sparkles,
  },
  {
    title: "Stay on Trend",
    description: "Real-time fashion insights to help you make confident style decisions.",
    icon: TrendingUp,
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      navigate("/");
    }
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8 space-y-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Icon size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display gradient-text">{currentStep.title}</h2>
              <p className="text-muted-foreground mt-2">{currentStep.description}</p>
            </div>

            <div className="flex gap-2 justify-center">
              {steps.map((_, i) => (
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
              <Button onClick={next} className="rounded-full gap-1">
                {step < steps.length - 1 ? (
                  <>
                    Next <ChevronRight size={16} />
                  </>
                ) : (
                  <>
                    Get Started <Check size={16} />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
