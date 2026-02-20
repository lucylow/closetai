// src/components/OnboardingModal.tsx
import React, { useEffect, useRef } from 'react';

type OnboardingModalProps = {
  open: boolean;
  onClose: () => void;
  onStart: () => void;
};

export default function OnboardingModal({ open, onClose, onStart }: OnboardingModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Welcome to ClosetAI
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Get outfit suggestions and try them on in three quick steps.
            </p>
            <ol className="list-decimal ml-5 mt-4 text-sm space-y-2 text-gray-700 dark:text-gray-300">
              <li>Upload a photo of a garment</li>
              <li>See suggested outfits</li>
              <li>Try it on and generate a social caption</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button 
            ref={closeRef}
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Skip
          </button>
          <button 
            onClick={onStart} 
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded font-medium"
          >
            Start (Upload)
          </button>
        </div>
      </div>
    </div>
  );
}
