import React, { useState } from 'react';
import { HairUploader } from './components/HairUploader';
import { VariantGallery } from './components/VariantGallery';
import { PaletteViewer } from './components/PaletteViewer';
import { ProductRecommendations } from './components/ProductRecommendations';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface AnalysisResult {
  result: any;
  palette: any[];
  products: any[];
  color_analysis: any;
}

function App() {
  const [loading, setLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleUpload = async (file: File, taskTypes: string[]) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('task_types', JSON.stringify(taskTypes));
      formData.append('consent_version', 'v1');

      const response = await fetch(`${API_URL}/api/perfect/hair/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.hair_analysis_id) {
        setAnalysisId(data.hair_analysis_id);
        pollForResult(data.hair_analysis_id);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollForResult = async (id: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/api/perfect/hair/result/${id}`);
        if (response.ok) {
          const data = await response.json();
          setResult(data);
          return true;
        }
      } catch (error) {
        console.error('Poll failed:', error);
      }
      return false;
    };

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      const done = await poll();
      if (done) clearInterval(interval);
    }, 2000);
  };

  return (
    <div className="hair-studio">
      <h1>Hair Studio</h1>
      <p>AI-Powered Hair Analysis & Try-On</p>
      
      <div className="studio-layout">
        <div className="upload-panel">
          <HairUploader onUpload={handleUpload} loading={loading} />
        </div>
        
        <div className="results-panel">
          {result && (
            <>
              {result.palette && <PaletteViewer palette={result.palette} />}
              {result.result?.edits?.hair_color_variants && (
                <VariantGallery 
                  title="Hair Color Try-On" 
                  variants={result.result.edits.hair_color_variants} 
                />
              )}
              {result.result?.edits?.hairstyle_variants && (
                <VariantGallery 
                  title="Hairstyle Options" 
                  variants={result.result.edits.hairstyle_variants} 
                />
              )}
              {result.products && <ProductRecommendations products={result.products} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
