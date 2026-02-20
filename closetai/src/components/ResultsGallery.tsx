// src/components/ResultsGallery.tsx
import React, { useState } from 'react';
import type { Recommendation } from '../types';
import { createTryon } from '../services/gen.service';
import { useCreativeStore } from '../stores/useCreativeStore';

export default function ResultsGallery({ recommendations }: { recommendations: Recommendation[] }) {
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [tryOnTaskId, setTryOnTaskId] = useState<string | null>(null);
  const [loadingTryOn, setLoadingTryOn] = useState(false);
  const setTryOnOpen = useCreativeStore((s) => s.ui.setTryOnOpen);

  async function handleTryOn(rec: Recommendation) {
    setLoadingTryOn(true);
    try {
      // Use demo API endpoint
      const res = await fetch('/api/demo/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          baseImageUrl: '/placeholders/selfie_demo.jpg', 
          recommendation: { id: rec.id, items: rec.items } 
        })
      });
      const json = await res.json();
      setTryOnTaskId(json.taskId);
      setSelected(rec);
      setTryOnOpen(true);
    } catch (e: any) {
      console.error(e);
      alert('Try-on failed: ' + (e.message || e));
    } finally {
      setLoadingTryOn(false);
    }
  }

  async function handleSave(rec: Recommendation) {
    try {
      // Demo save - just show alert
      alert('Saved: ' + rec.id);
    } catch (e: any) {
      console.error(e);
      alert('Save failed: ' + (e.message || e));
    }
  }

  return (
    <div className="results-gallery grid gap-4">
      {recommendations.length === 0 && <div className="text-sm text-gray-500">No results yet.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="rec-card border rounded p-3 flex gap-3">
            <img src={rec.outfitImageUrl ?? rec.items[0]?.imageUrl} alt={rec.rationale ?? 'Outfit'} className="w-36 h-36 object-cover rounded" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{rec.items.map((i) => i.name).join(' + ')}</div>
                  <div className="text-xs text-gray-500">{rec.rationale}</div>
                </div>
                <div className="text-sm text-green-600">{Math.round((rec.score || 0) * 100)}%</div>
              </div>
              {rec.caption && <div className="mt-2 text-sm text-gray-700">{rec.caption}</div>}
              {rec.hashtags && <div className="mt-2 flex gap-2 flex-wrap">{rec.hashtags.map((h) => <span key={h} className="tag text-xs">{h}</span>)}</div>}
              <div className="mt-3 flex gap-2">
                <button className="btn btn-outline" onClick={() => handleTryOn(rec)}>Preview Try-On</button>
                <button className="btn btn-secondary" onClick={() => handleSave(rec)}>Save</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <h3 className="text-lg font-semibold">Try-On: {selected.items.map(i => i.name).join(' + ')}</h3>
            <p className="text-sm text-gray-500">{selected.rationale}</p>
            <p className="mt-2">Task ID: {tryOnTaskId}</p>
            <p className="text-sm">Status: {loadingTryOn ? 'Processing...' : 'Ready'}</p>
            <button className="btn mt-4" onClick={() => setTryOnOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
