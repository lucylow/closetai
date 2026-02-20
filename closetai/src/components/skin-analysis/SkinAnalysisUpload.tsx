import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = { onResult: (r: any) => void };

export default function SkinAnalysisUpload({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const pollingRef = useRef<number | undefined>(undefined);

  async function handleUpload() {
    if (!file) return;
    setStatus('Uploading...');
    const fd = new FormData();
    fd.append('selfie', file);
    try {
      const res = await fetch('/api/skin-analysis', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      const { taskId } = data;
      setTaskId(taskId);
      setStatus('Processing...');
      pollStatus(taskId);
    } catch (e: any) {
      setStatus('Upload error: ' + (e?.message || 'unknown'));
    }
  }

  async function pollStatus(taskId: string) {
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/skin-analysis/status/${taskId}`);
        const data = await res.json();
        if (data.status === 'completed') {
          setStatus('Completed');
          onResult(data);
          window.clearInterval(pollingRef.current);
        } else if (data.status === 'error') {
          setStatus('Error: ' + (data.message || 'analysis failed'));
          window.clearInterval(pollingRef.current);
        } else {
          setStatus('Processing... (this may take a few seconds)');
        }
      } catch (err) {
        setStatus('Error checking status');
      }
      if (attempts > 40) {
        setStatus('Timed out');
        window.clearInterval(pollingRef.current);
      }
    };
    pollingRef.current = window.setInterval(poll, 2000) as unknown as number;
    poll();
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('');
  }

  return (
    <div className="space-y-4">
      <div className="w-full aspect-square bg-muted rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/20">
        {preview ? (
          <img src={preview} className="w-full h-full object-cover" alt="preview" />
        ) : (
          <div className="text-center p-6">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm text-muted-foreground">No selfie selected</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input id="file" type="file" accept="image/*" onChange={onSelect} className="hidden" />
        <Button variant="outline" onClick={() => document.getElementById('file')?.click()} className="flex-1">
          Select Photo
        </Button>
        <Button onClick={handleUpload} disabled={!file} className="flex-1">
          Analyze
        </Button>
      </div>

      {status && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-primary">Status:</span>
            <span className="text-muted-foreground">{status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
