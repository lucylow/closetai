import { useState } from 'react';
import { useCreativeStore } from '../../stores/useCreativeStore';

interface GeneratorFormProps {
  onGenerate: (params: {
    seedItemIds: string[];
    context: { occasion?: string; weather?: string; vibe?: string };
    options: { numResults?: number; includeContent?: boolean };
  }) => void;
  isLoading: boolean;
}

export function GeneratorForm({ onGenerate, isLoading }: GeneratorFormProps) {
  const { seedItems, selectedSeedIds, toggleSeedSelection } = useCreativeStore();
  const [occasion, setOccasion] = useState('');
  const [vibe, setVibe] = useState('');
  const [numResults, setNumResults] = useState(3);
  const [includeContent, setIncludeContent] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      seedItemIds: selectedSeedIds,
      context: { occasion, vibe },
      options: { numResults, includeContent },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="generator-form space-y-4">
      <div>
        <label className="block font-medium mb-2">Select Seed Items</label>
        <div className="grid grid-cols-3 gap-2">
          {seedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleSeedSelection(item.id)}
              className={`p-2 border rounded ${selectedSeedIds.includes(item.id) ? 'border-blue-500 bg-blue-50' : ''}`}
              aria-pressed={selectedSeedIds.includes(item.id)}
            >
              <img src={item.imageUrl} alt={item.name} className="w-full h-20 object-cover mb-1" />
              <span className="text-sm">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1">Occasion</label>
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Any</option>
            <option value="work">Work</option>
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="date">Date Night</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">Vibe</label>
          <select value={vibe} onChange={(e) => setVibe(e.target.value)} className="w-full p-2 border rounded">
            <option