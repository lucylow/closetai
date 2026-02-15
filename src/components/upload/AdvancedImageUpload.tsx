import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, Check, Loader2, X } from "lucide-react";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useAdvancedWardrobe } from "@/hooks/useAdvancedWardrobe";
import "./AdvancedImageUpload.css";

const steps = [
  { id: "validate", label: "Validating", icon: "🔍" },
  { id: "remove-bg", label: "Removing background", icon: "✨" },
  { id: "extract", label: "Extracting attributes", icon: "🎨" },
  { id: "embed", label: "Generating embedding", icon: "🧠" },
  { id: "save", label: "Saving to wardrobe", icon: "💾" },
];

const currentStepIndex = (stepId: string | null) =>
  stepId ? steps.findIndex((s) => s.id === stepId) : -1;

const AdvancedImageUpload = () => {
  const { uploadAndProcess } = useImageProcessing();
  const { addItem } = useAdvancedWardrobe();
  const [files, setFiles] = useState<
    (File & { preview?: string; id?: string })[]
  >([]);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [processedItem, setProcessedItem] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${file.name}`,
        })
      )
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => (f.id ?? f.name) !== id));
  };

  const processFile = async (file: File & { preview?: string; id?: string }) => {
    setProcessing(true);
    setError(null);
    setCurrentStep("validate");
    try {
      await new Promise((r) => setTimeout(r, 500));
      setCurrentStep("remove-bg");
      await new Promise((r) => setTimeout(r, 800));
      setCurrentStep("extract");
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep("embed");
      await new Promise((r) => setTimeout(r, 700));
      setCurrentStep("save");

      const result = await uploadAndProcess(file);
      await addItem(result);
      setProcessedItem(result);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
      setCurrentStep(null);
    }
  };

  return (
    <div className="advanced-upload">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        <CloudUpload className="upload-icon" size={48} />
        <p>Drag & drop images here, or click to select</p>
        <small>Supports JPG, PNG, WEBP (max 10MB each)</small>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="file-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {files.map((file) => (
              <div key={file.id ?? file.name} className="file-item">
                <img
                  src={file.preview}
                  alt="preview"
                  className="file-preview"
                />
                <span className="file-name">{file.name}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeFile(file.id ?? file.name)}
                >
                  <X size={16} />
                </button>
                {!processing && (
                  <button
                    type="button"
                    className="process-btn"
                    onClick={() => processFile(file)}
                  >
                    Process
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {processing && (
        <div className="processing-status">
          <div className="steps">
            {steps.map((step) => {
              const stepIdx = currentStepIndex(step.id);
              const currentIdx = currentStepIndex(currentStep);
              const isActive = currentStep === step.id;
              const isCompleted = currentIdx > stepIdx;
              return (
                <div
                  key={step.id}
                  className={`step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                >
                  <span className="step-icon">
                    {isActive ? (
                      <Loader2 size={24} className="spin" />
                    ) : (
                      step.icon
                    )}
                  </span>
                  <span className="step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {processedItem && (
        <motion.div
          className="success-message"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <Check size={20} /> Item added to wardrobe!
          <button type="button" onClick={() => setProcessedItem(null)}>
            OK
          </button>
        </motion.div>
      )}

      {error && (
        <div className="error-message">
          <X size={20} /> {error}
        </div>
      )}
    </div>
  );
};

export default AdvancedImageUpload;
