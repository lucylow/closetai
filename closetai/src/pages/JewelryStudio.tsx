/**
 * Jewelry AR Try-On Studio Page
 * 
 * Allows users to virtually try on rings, bracelets, watches, earrings, and necklaces
 * using PerfectCorp AR technology
 */

import { useState, useEffect } from 'react';
import { 
  submitJewelryTryOn, 
  getJewelryTypes, 
  pollForResult,
  JewelryTryOnParams,
  JewelryVariant,
  JewelryTypes
} from '../services/jewelryTryon.service';

// Jewelry type icons (using emoji as placeholder)
const JEWELRY_ICONS: Record<string, string> = {
  ring: '💍',
  bracelet: '⛓️',
  watch: '⌚',
  earring: '✨',
  necklace: '📿'
};

export default function JewelryStudio() {
  // State
  const [jewelryTypes, setJewelryTypes] = useState<JewelryTypes | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ring');
  const [selectedMetal, setSelectedMetal] = useState<string>('gold');
  const [selectedStyle, setSelectedStyle] = useState<string>('classic');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<JewelryVariant | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load jewelry types on mount
  useEffect(() => {
    async function loadTypes() {
      try {
        const types = await getJewelryTypes();
        setJewelryTypes(types);
      } catch (err) {
        console.error('Failed to load jewelry types:', err);
      }
    }
    loadTypes();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consentChecked) {
      setError('Please accept the privacy policy to continue');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setResult(null);
    setSelectedVariant(null);

    try {
      // Submit try-on request
      const response = await submitJewelryTryOn({
        jewelry_type: selectedType as JewelryTryOnParams['jewelry_type'],
        metal_color: selectedMetal as any,
        style: selectedStyle,
        src_file_url: imageUrl,
        consent_version: 'v1'
      } as JewelryTryOnParams);

      // Poll for result
      const taskResult = await pollForResult(
        response.data.task_id,
        (p) => setProgress(p)
      );

      setResult(taskResult);
      
      // Auto-select first variant
      if (taskResult.output?.variants?.length > 0) {
        setSelectedVariant(taskResult.output.variants[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process jewelry try-on');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            💎 Jewelry AR Studio
          </h1>
          <p className="text-gray-600">
            Try on rings, bracelets, watches, earrings, and necklaces virtually
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Configure Your Try-On</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Jewelry Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Jewelry Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['ring', 'bracelet', 'watch', 'earring', 'necklace'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedType === type
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-2xl block">{JEWELRY_ICONS[type]}</span>
                      <span className="text-xs capitalize mt-1 block">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Metal Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metal Color
                </label>
                <div className="flex gap-3">
                  {['gold', 'silver', 'rose_gold', 'platinum'].map((metal) => (
                    <button
                      key={metal}
                      type="button"
                      onClick={() => setSelectedMetal(metal)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedMetal === metal
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span 
                        className="inline-block w-4 h-4 rounded-full mr-2"
                        style={{ 
                          backgroundColor: 
                            metal === 'gold' ? '#D4AF37' :
                            metal === 'silver' ? '#C0C0C0' :
                            metal === 'rose_gold' ? '#B76E79' : '#E5E4E2'
                        }}
                      />
                      <span className="capitalize">{metal.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="vintage">Vintage</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="bohemian">Bohemian</option>
                </select>
              </div>

              {/* Image URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use demo image
                </p>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <label htmlFor="consent" className="text-sm text-gray-600">
                  I consent to the processing of my image for AR try-on purposes. 
                  See our <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !consentChecked}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  isLoading || !consentChecked
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {isLoading ? 'Processing...' : 'Try On Jewelry'}
              </button>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Right Panel - Results */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Try-On Results</h2>
            
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your try-on...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
              </div>
            )}

            {result && !isLoading && (
              <div className="space-y-6">
                {/* Main Result Image */}
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  {result.output?.composite_url ? (
                    <img 
                      src={result.output.composite_url} 
                      alt="Try-on result"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No result available
                    </div>
                  )}
                </div>

                {/* Ring Size Estimate (for rings) */}
                {result.output?.metrics?.estimated_ring_size && (
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h3 className="font-semibold text-purple-800 mb-2">📏 Estimated Ring Size</h3>
                    <div className="flex gap-6">
                      <div>
                        <span className="text-2xl font-bold text-purple-600">
                          {result.output.metrics.estimated_ring_size.us}
                        </span>
                        <span className="text-gray-600 ml-1">US</span>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-purple-600">
                          {result.output.metrics.estimated_ring_size.eu}
                        </span>
                        <span className="text-gray-600 ml-1">EU</span>
                      </div>
                      <div className="ml-auto text-right">
                        <span className="text-sm text-gray-500">
                          Confidence: {Math.round(result.output.metrics.estimated_ring_size.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wrist Size Estimate (for bracelets/watches) */}
                {result.output?.metrics?.wrist_circumference_mm && (
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h3 className="font-semibold text-purple-800 mb-2">📏 Wrist Circumference</h3>
                    <span className="text-2xl font-bold text-purple-600">
                      {result.output.metrics.wrist_circumference_mm}mm
                    </span>
                  </div>
                )}

                {/* Variants Selection */}
                {result.output?.variants && result.output.variants.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Try Different Variants</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {result.output.variants.map((variant: JewelryVariant) => (
                        <button
                          key={variant.variant_id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedVariant?.variant_id === variant.variant_id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div 
                            className="w-full aspect-square bg-gray-100 rounded-lg mb-2"
                            style={{
                              backgroundColor: 
                                variant.metal === 'gold' ? '#D4AF37' :
                                variant.metal === 'silver' ? '#C0C0C0' :
                                variant.metal === 'rose_gold' ? '#B76E79' : '#E5E4E2'
                            }}
                          />
                          <span className="text-xs capitalize">{variant.metal}</span>
                          {variant.sku && (
                            <span className="block text-xs text-gray-500">{variant.sku}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {selectedVariant && (
                  <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all">
                    Save to Wardrobe
                  </button>
                )}
              </div>
            )}

            {!isLoading && !result && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-6xl block mb-4">💍</span>
                <p>Configure your try-on and click the button to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
