import React, { useState } from 'react';
export default function PreviewBeforeAfter({ before, after }: { before?: string; after?: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      {before && <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />}
      {after && (
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}
      <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-x-0 bottom-4 z-10" />
    </div>
  );
}
