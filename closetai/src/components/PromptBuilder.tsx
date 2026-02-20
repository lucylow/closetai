// src/components/PromptBuilder.tsx
import React, { useMemo } from 'react';

type Props = {
  seedItemsCount: number;
  value?: {
    occasion?: string;
    vibe?: string;
    weather?: string;
    numResults?: number;
    includeContent?: boolean;
  };
  onChange?: (v: any) => void;
};

const OCCASIONS = ['work', 'casual', 'date', 'wedding', 'vacation'];
const VIBES = ['minimal', 'bold', 'vintage', 'athleisure', 'elevated'];
const NUM_RESULTS = [3, 5, 7];

export default function PromptBuilder({ seedItemsCount, value, onChange }: Props) {
  const val = value ?? {};
  const handle = (patch: any) => onChange?.({ ...value, ...patch });

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (val.vibe) parts.push(val.vibe);
    if (val.occasion) parts.push(val.occasion);
    if (val.weather) parts.push(val.weather);
    if (!parts.length) return 'No context selected';
    return parts.join(' · ');
  }, [val]);

  return (
    <div className="prompt-builder card p-4">
      <h3 className="text-lg font-medium">Build context</h3>
      <p className="text-sm text-gray-600">Seed items: {seedItemsCount} selected</p>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Occasion</label>
          <select value={val.occasion ?? ''} onChange={(e) => handle({ occasion: e.target.value || undefined })}>
            <option value="">Any</option>
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Vibe</label>
          <select value={val.vibe ?? ''} onChange={(e) => handle({ vibe: e.target.value || undefined })}>
            <option value="">Any</option>
            {VIBES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Weather</label>
          <select value={val.weather ?? ''} onChange={(e) => handle({ weather: e.target.value || undefined })}>
            <option value="">Any</option>
            <option value="sunny">Sunny</option>
            <option value="rain">Rain</option>
            <option value="cold">Cold</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <label className="block text-sm font-medium">Results</label>
        <select
          value={val.numResults ?? 3}
          onChange={(e) => handle({ numResults: Number(e.target.value) })}
          aria-label="Number of results"
        >
          {NUM_RESULTS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <label className="inline-flex items-center ml-4">
          <input
            type="checkbox"
            checked={!!val.includeContent}
            onChange={(e) => handle({ includeContent: e.target.checked })}
          />
          <span className="ml-2 text-sm">Include caption & hashtags</span>
        </label>
      </div>
      <div className="mt-3">
        <p className="text-sm text-gray-700">Summary: {summary}</p>
      </div>
    </div>
  );
}
