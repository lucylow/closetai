/**
 * OutfitSuggestions Component
 * 
 * Displays AI-generated outfit recommendations
 * Allows users to try on, save, or dismiss suggestions
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

interface OutfitSuggestion {
  itemIds: string[];
  items: Array<{
    id: string;
    image_url: string;
    category: string;
  }>;
  score: number;
  explanation: string;
}

interface OutfitSuggestionsProps {
  userId: string;
  occasion?: string;
  onTryOn?: (suggestion: OutfitSuggestion) => void;
  onSave?: (suggestion: OutfitSuggestion) => void;
}

export function OutfitSuggestions({ userId, occasion, onTryOn, onSave }: OutfitSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState(occasion || 'casual');

  const occasions = ['casual', 'formal', 'work', 'party', 'sport'];

  useEffect(() => {
    fetchSuggestions();
  }, [userId, selectedOccasion]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/outfits/suggest', {
        userId,
        occasion: selectedOccasion,
        limit: 6
      });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTryOn = (suggestion: OutfitSuggestion) => {
    onTryOn?.(suggestion);
  };

  const handleSave = async (suggestion: OutfitSuggestion) => {
    try {
      await axios.post('/api/outfits/save', {
        userId,
        name: `${selectedOccasion} look`,
        itemIds: suggestion.itemIds,
        occasion: selectedOccasion,
        score: suggestion.score
      });
      onSave?.(suggestion);
    } catch (error) {
      console.error('Failed to save outfit:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Outfit Suggestions</h2>
        <button
          onClick={fetchSuggestions}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
        >
          Refresh
        </button>
      </div>

      {/* Occasion Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {occasions.map((occ) => (
          <button
            key={occ}
            onClick={() => setSelectedOccasion(occ)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap capitalize ${
              selectedOccasion === occ
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {occ}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No suggestions available.</p>
          <p className="text-sm mt-2">Add more items to your wardrobe</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border rounded-xl overflow-hidden bg-white shadow-sm"
            >
              {/* Items Preview */}
              <div className="flex h-32">
                {suggestion.items?.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex-1 relative">
                    <img
                      src={item.image_url}
                      alt={item.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">
                  {suggestion.explanation}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Score: {Math.round(suggestion.score * 100)}%
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTryOn(suggestion)}
                      className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Try On
                    </button>
                    <button
                      onClick={() => handleSave(suggestion)}
                      className="px-3 py-1 text-sm bg-primary text-white rounded hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}