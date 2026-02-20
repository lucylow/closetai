import React from 'react';
export default function VariantGallery({ variants }: { variants?: any }) {
  const allVariants = [...(variants?.clothing_variants || []), ...(variants?.hat_variants || []), ...(variants?.shoe_variants || [])];
  if (!allVariants.length) return <div className="text-gray-500">No variants available</div>;
  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Variants</h3>
      <div className="grid grid-cols-3 gap-2">
        {allVariants.map((v: any, i: number) => (
          <div key={i} className="border rounded-lg p-2 hover:shadow-md cursor-pointer">
            <div className="w-full h-20 bg-gray-100 rounded mb-2" />
            <p className="text-xs text-gray-600">{v.color_hex || v.variant_id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
