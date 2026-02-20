import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import "./GuidedTour.css";

const tourSteps = [
  {
    target: ".wardrobe-link",
    title: "Your Wardrobe",
    content:
      "Upload photos of your clothes. Our AI will automatically extract colors, patterns, and styles.",
    position: "bottom",
  },
  {
    target: ".outfits-link",
    title: "Daily Outfits",
    content:
      "Get personalized outfit suggestions based on weather, occasion, and current fashion trends.",
    position: "bottom",
  },
  {
    target: ".trends-link",
    title: "Fashion Trends",
    content:
      "Explore real-time trends from You.com with full citations from top fashion sources.",
    position: "bottom",
  },
  {
    target: ".content-link",
    title: "Content Generator",
    content:
      "Create Instagram-ready captions, hashtags, and AI-styled images for your outfits.",
    position: "top",
  },
  {
    target: ".shopping-link",
    title: "Shopping Assistant",
    content:
      "Upload a screenshot of an item you're considering; see how it matches your existing wardrobe.",
    position: "top",
  },
  {
    target: ".tryon-link",
    title: "Virtual Try-On",
    content:
      "See how clothes look on you with Perfect Corp AR technology.",
    position: "top",
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuidedTour = ({ isOpen, onClose }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      const element = document.querySelector(tourSteps[currentStep].target);
      setTargetElement(element);
    }
  }, [isOpen, currentStep]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const element = targetElement ?? document.querySelector(step.target);
  const rect = element?.getBoundingClientRect();

  if (!rect) {
    return (
      <div className="tour-overlay" onClick={onClose}>
        <motion.div
          className="tour-tooltip tour-tooltip-fallback"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="tour-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
          <h3>{step.title}</h3>
          <p>{step.content}</p>
          <div className="tour-progress">
            <span>
              {currentStep + 1} / {tourSteps.length}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="tour-actions">
            {currentStep > 0 && (
              <button
                type="button"
                className="prev-btn"
                onClick={prevStep}
              >
                <ArrowLeft size={14} /> Previous
              </button>
            )}
            <button type="button" className="next-btn" onClick={nextStep}>
              {currentStep < tourSteps.length - 1 ? (
                <>Next <ArrowRight size={14} /></>
              ) : (
                "Finish"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const tooltipPosition = {
    top: step.position === "top" ? rect.top - 10 : rect.bottom + 10,
    left: rect.left + rect.width / 2,
  };

  return (
    <div className="tour-overlay" onClick={onClose}>
      <AnimatePresence>
        <motion.div
          className="tour-tooltip"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: "translate(-50%, 0)",
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="tour-close" onClick={onClose}>
            <X size={18} />
          </button>
          <h3>{step.title}</h3>
          <p>{step.content}</p>
          <div className="tour-progress">
            <span>
              {currentStep + 1} / {tourSteps.length}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="tour-actions">
            {currentStep > 0 && (
              <button type="button" className="prev-btn" onClick={prevStep}>
                <ArrowLeft size={14} /> Previous
              </button>
            )}
            <button type="button" className="next-btn" onClick={nextStep}>
              {currentStep < tourSteps.length - 1 ? (
                <>Next <ArrowRight size={14} /></>
              ) : (
                "Finish"
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GuidedTour;
