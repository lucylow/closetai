/**
 * AR Studio Page - Main AR Try-On interface
 */
import React, { useState } from 'react';
import Uploader from '../components/Uploader';
import PreviewBeforeAfter from '../components/PreviewBeforeAfter';
import VariantGallery from '../components/VariantGallery';
import ProductRecommendations from '../components/ProductRecommendations';

export default function ARStudio() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [arResult, setArResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState(['clothing_tryon']);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleImageUpload = async (file) => {
    if (!consentGiven) { alert('Please provide consent first'); return; }
    setSelectedImage(URL.createObjectURL(file));
    setLoading(true);
    const formData = new FormData();
    formData.append('selfie', file);
    formData.append('task_types', JSON.stringify(selectedFeatures));
    formData.append('consent_version', 'v1');
    try {
      const res = await fetch('/api/ar/tryon', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.ok) { pollForResult(data.ar_result_id); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const pollForResult = async (resultId) => {
    const poll = setInterval(async () => {
      const res = await fetch('/api/ar/result/' + resultId);
      const data = await res.json();
      if (data.status === 'success') { setArResult(data); clearInterval(poll); }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-900 mb-6">AR Try-On Studio</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <label className="flex items-center space-x-2 mb-4">
                <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">I consent to image processing for AR try-on</span>
              </label>
              <Uploader onUpload={handleImageUpload} loading={loading} />
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="flex flex-wrap gap-2">
                  {['clothing_tryon', 'hat_overlay', 'bag_overlay', 'scarf_overlay', 'shoe_tryon'].map(f => (
                    <button key={f} onClick={() => setSelectedFeatures([f])} className={`px-3 py-1 rounded-full text-sm ${selectedFeatures.includes(f) ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{f.replace('_', ' ')}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {selectedImage && <PreviewBeforeAfter before={selectedImage} after={arResult?.edits?.final_composite_urls?.low_res} />}
            {arResult && <VariantGallery variants={arResult.edits} />}
            {arResult && <ProductRecommendations recommendations={arResult.edits} />}
          </div>
        </div>
      </div>
    </div>
  );
}
