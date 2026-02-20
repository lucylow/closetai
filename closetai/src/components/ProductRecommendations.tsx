import React from 'react';
export default function ProductRecommendations({ recommendations }: { recommendations?: any }) {
  const items = recommendations ? [...(recommendations.clothing_variants || []), ...(recommendations.hat_variants || [])] : [];
  if (!items.length) return null;
  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Recommended Products</h3>
      <div className="space-y-2">
        {items.slice(0, 5).map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
            <span className="text-sm">{item.variant_id}</span>
            <button className="px-3 py-1 bg-teal-500 text-white text-sm rounded">View</button>
          </div>
        ))}
      </div>
    </div>
  );
}
