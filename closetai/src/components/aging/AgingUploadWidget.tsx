/**
 * Aging Upload Widget - Handles face image upload for aging analysis
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgingUploadWidgetProps {
  onAnalysisStarted: (jobId: string) => void;
}

export default function AgingUploadWidget({ onAnalysisStarted }: AgingUploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = localStorage.getItem('userId') || 'demo-user';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      // Step 1: Get signed upload URL
      const urlResponse = await fetch('/api/aging/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          filename: file.name,
          contentType: file.type
        })
      });

      if (!urlResponse.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, key } = await urlResponse.json();
      setUploadProgress(30);

      // Step 2: Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      setUploadProgress(60);

      // Step 3: Start analysis
      const analyzeResponse = await fetch('/api/aging/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          srcKey: key,
          requestedMetrics: ['wrinkle', 'pore', 'pigment', 'moisture', 'elasticity', 'uv_damage']
        })
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        if (errorData.requiresConsent) {
          setError('Please provide consent before analysis');
          return;
        }
        throw new Error('Failed to start analysis');
      }

      const { jobId } = await analyzeResponse.json();
      setUploadProgress(100);
      onAnalysisStarted(jobId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      {preview && (
        <div className="relative aspect-square max-w-[300px] mx-auto rounded-lg overflow-hidden bg-muted">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <Button 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
        size="lg"
      >
        {uploading ? 'Uploading...' : 'Select Photo'}
      </Button>

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-center text-muted-foreground">
            {uploadProgress < 30 ? 'Preparing upload...' : 
             uploadProgress < 60 ? 'Uploading image...' : 
             'Starting analysis...'}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">For best results:</p>
        <ul className="list-disc list-inside">
          <li>Use natural lighting</li>
          <li>Face the camera directly</li>
          <li>Remove glasses and hair from face</li>
          <li>Keep a neutral expression</li>
        </ul>
      </div>
    </div>
  );
}
