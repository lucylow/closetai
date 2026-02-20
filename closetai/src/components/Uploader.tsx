/**
 * Uploader Component - Image upload with camera support
 */
import React, { useRef } from 'react';

interface UploaderProps {
  onUpload: (file: File) => void;
  loading?: boolean;
}

export default function Uploader({ onUpload, loading }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleChange} className="hidden" />
      <div className="space-y-4">
        <div className="text-4xl">📸</div>
        <p className="text-gray-600">Take a photo or upload an image</p>
        <button onClick={() => inputRef.current?.click()} disabled={loading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {loading ? 'Processing...' : 'Choose Image'}
        </button>
      </div>
    </div>
  );
}
