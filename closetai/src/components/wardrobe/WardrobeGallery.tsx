/**
 * WardrobeGallery Component
 * 
 * Displays user's wardrobe items in a grid layout
 * Supports filtering by category
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

interface WardrobeItem {
  id: string;
  image_url: string;
  thumbnail_url?: string;
  category?: string;
  color?: string[];
  tags?: string[];
  last_worn?: string;
  wear_count?: number;
  created_at: string;
}

interface WardrobeGalleryProps {
  userId: string;
  onItemClick?: (item: WardrobeItem) => void;
}

export function WardrobeGallery({ userId, onItemClick }: WardrobeGalleryProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [total, setTotal] = useState(0);
  
  const { get } = { get: (url: string) => axios.get(url).then(r => r.data) };

  useEffect(() => {
    loadItems();
  }, [userId, category]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId });
      if (category) params.append('category', category);
      
      const response = await get(`/api/wardrobe?${params}`);
      setItems(response.items || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load wardrobe:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['', 'top', 'bottom', 'outerwear', 'shoes', 'accessory'];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Your Wardrobe</h2>
        <span className="text-gray-500">{total} items</span>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat || 'all'}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              category === cat
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat || 'All Items'}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No items in your wardrobe yet.</p>
          <p className="text-sm mt-2">Upload some clothes to get started</p>
        </div>
      )}

      {/* Items Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.category}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium capitalize">{item.category}</p>
                <p className="text-xs text-gray-500">
                  {item.wear_count ? `Worn ${item.wear_count} times` : 'Never worn'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}