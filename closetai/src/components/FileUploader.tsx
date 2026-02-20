// src/components/FileUploader.tsx
import React, { useCallback, useState } from 'react';

type FileUploaderProps = {
  onUpload: (file: File, previewUrl: string) => void;
  accept?: string;
  maxSizeMB?: number;
};

export default function FileUploader({ 
  onUpload, 
  accept = 'image/*', 
  maxSizeMB = 8 
}: FileUploaderProps) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = useCallback((file: File | null) => {
    setError(null);
    if (!file) return;
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB`);
      return;
    }
    
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file, url);
  }, [maxSizeMB, onUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  };

  const handleDragLeave = () => {
    setDrag(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    onFile(file ?? null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFile(file);
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          drag 
            ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          aria-label="file upload"
          type="file" 
          accept={accept} 
          className="hidden" 
          id="file-input"
          onChange={handleFileChange}
        />
        <label 
          htmlFor="file-input" 
          className="cursor-pointer"
        >
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Drag & drop an image here, or{' '}
            <span className="text-teal-500 hover:text-teal-600 font-medium">
              browse
            </span>
          </div>
        </label>
        
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
        
        {preview && (
          <img 
            src={preview} 
            alt="preview" 
            className="mx-auto mt-4 w-48 h-48 object-cover rounded-lg shadow-md" 
          />
        )}
      </div>
    </div>
  );
}
