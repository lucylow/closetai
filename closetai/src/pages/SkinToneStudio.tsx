/**
 * Skin Tone Studio - Frontend Page
 * Upload selfie and get skin tone analysis with color palettes
 */

import React, { useState, useCallback } from 'react';
import { PaletteViewer } from '../components/PaletteViewer';
import { SkinToneResultPanel } from '../components/SkinToneResultPanel';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface AnalyzeResponse {
  ok: boolean;
  skin_task_id: string;
  skin_analysis_id: string;
}

interface SkinToneResult {
  id: string;
  skin_tone_hex: string;
  undertone: string;
  suggested_season: string;
  palette: string[];
  palette_reason: string;
  tone_confidence: number;
}

export function SkinToneStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentVersion, setConsentVersion] = useState('v1');
  const [mode, setMode] = useState<'sd' | 'hd'>('sd');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<SkinToneResult | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setStatus('Uploading...');
    
    try {
      const formData = new FormData();
      formData.append('selfie', file);
      formData.append('consent_version', consentVersion);
      formData.append('mode', mode);
      
      const response = await fetch(`${API_URL}/api/skin-tone/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Analysis failed');
      }
      
      const data: AnalyzeResponse = await response.json();
      setTaskId(data.skin_task_id);
      setAnalysisId(data.skin_analysis_id);
      setStatus('Analyzing...');
      
      // Poll for results
      pollForResults(data.skin_analysis_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };
  
  const pollForResults = async (analysisId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/api/skin-tone/result/${analysisId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.result?.status === 'success') {
            setResult(data.result);
            setStatus('Complete');
            setLoading(false);
            return;
          }
        }
        if (loading) {
          setTimeout(poll, 2000);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    };
    setTimeout(poll, 2000);
  };

  return (
    <div className="skin-tone-studio">
      <header>
        <h1>Skin Tone Analysis</h1>
        <p>Discover your perfect color palette</p>
      </header>
      
      <main>
        {/* Consent */}
        <section className="consent-section">
          <label>
            <input 
              type="checkbox" 
              checked={consentVersion !== ''}
              onChange={(e) => setConsentVersion(e.target.checked ? 'v1' : '')}
            />
            I consent to having my photo analyzed for skin tone
          </label>
        </section>
        
        {/* Upload */}
        <section className="upload-section">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            id="selfie-upload"
          />
          {preview && (
            <img src={preview} alt="Preview" className="preview-image" />
          )}
        </section>
        
        {/* Mode Selection */}
        <section className="mode-section">
          <label>
            <input 
              type="radio" 
              name="mode" 
              value="sd" 
              checked={mode === 'sd'}
              onChange={() => setMode('sd')}
            />
            Standard (SD)
          </label>
          <label>
            <input 
              type="radio" 
              name="mode" 
              value="hd" 
              checked={mode === 'hd'}
              onChange={() => setMode('hd')}
            />
            High Definition (HD)
          </label>
        </section>
        
        {/* Analyze Button */}
        <button 
          onClick={handleAnalyze}
          disabled={!file || !consentVersion || loading}
          className="analyze-btn"
        >
          {loading ? 'Analyzing...' : 'Analyze My Colors'}
        </button>
        
        {/* Status */}
        {status && <div className="status">{status}</div>}
        
        {/* Error */}
        {error && <div className="error">{error}</div>}
        
        {/* Results */}
        {result && (
          <SkinToneResultPanel result={result} />
        )}
      </main>
    </div>
  );
}
