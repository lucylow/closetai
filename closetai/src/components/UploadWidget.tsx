// src/components/UploadWidget.tsx
import React, { useRef, useState } from 'react';
import type { SeedItem } from '../types';
import { uploadImage } from '../services/api';
import { useCreativeStore } from '../stores/useCreativeStore';

type Props = {
  userId?: string;
};

export default function UploadWidget({ userId }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [consent, setConsent] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const addSeedItem = useCreativeStore((s) => s.addSeedItem);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!consent) {
      alert('Please consent to use your photo for try-on.');
      return;
    }
    const file = files[0];
    setLoading(true);
    try {
      const result: SeedItem = await uploadImage(file, { userId });
      addSeedItem(result);
    } catch (e: any) {
      console.error(e);
      alert('Upload failed: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upload-widget card p-4" aria-live="polite">
      <label className="block text-sm font-medium text-gray-700">Add item to closet</label>
      <div className="mt-2 flex gap-2 items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          aria-label="Upload clothing photo"
        />
        <button
          className="btn btn-primary"
          onClick={() => inputRef.current?.click()}
          aria-label="Open camera or file picker"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
      <div className="mt-3">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-label="Consent to use photo for try-on"
          />
          <span className="ml-2 text-sm">I consent to use my photo for virtual try-on</span>
        </label>
      </div>
    </div>
  );
}
