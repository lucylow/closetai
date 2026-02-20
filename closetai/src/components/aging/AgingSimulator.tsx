/**
 * Aging Simulator - Visual age progression/regression tool
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgingSimulatorProps {
  onSimulationComplete: (jobId: string) => void;
}

export default function AgingSimulator({ onSimulationComplete }: AgingSimulatorProps) {
  const [yearsDelta, setYearsDelta] = useState(10);
  const [simulating, setSimulating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = localStorage.getItem('userId') || 'demo-user';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const runSimulation = async () => {
    if (!previewUrl) {
      setError('Please upload a photo first');
      return;
    }

    setSimulating(true);
    setError(null);

    try {
      const urlResponse = await fetch('/api/aging/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          filename: 'simulation-src.jpg',
          contentType: 'image/jpeg'
        })
      });

      const { uploadUrl, key } = await urlResponse.json();
      
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' }
      });

      const simResponse = await fetch('/api/aging/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          srcKey: key,
          yearsDelta,
          direction: yearsDelta > 0 ? 'older' : 'younger',
          strength: 0.8
        })
      });

      const { jobId } = await simResponse.json();
      onSimulationComplete(jobId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertDescription className="text-amber-800">
          <strong>Illustrative Only:</strong> This simulation shows how appearance might change 
          with age. It is an artistic representation, not a prediction.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="relative aspect-square max-w-[300px] w-full rounded-lg overflow-hidden bg-muted border-2 border-dashed">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
              <p className="text-muted-foreground mb-4">Upload a photo to simulate</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Select Photo
              </Button>
            </div>
          )}
        </div>

        <div className="w-full max-w-[300px] space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Years to simulate: {yearsDelta > 0 ? '+' : ''}{yearsDelta} years
            </label>
            <Slider
              value={[yearsDelta]}
              onValueChange={([value]) => setYearsDelta(value)}
              min={-20}
              max={20}
              step={5}
            />
          </div>

          <Button 
            onClick={runSimulation} 
            disabled={!previewUrl || simulating}
            className="w-full"
          >
            {simulating ? 'Generating...' : 'Run Simulation'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
