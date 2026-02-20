/**
 * GeneratePanel - Main generation UI component
 * Allows users to create text-to-image generations, image edits, and try-on
 */
import React, { useState, useCallback } from 'react';
import {
  createText2Img,
  pollJobStatus,
  JobStatus,
} from '../../services/gen.service';

interface GeneratePanelProps {
  onJobComplete?: (job: JobStatus) => void;
  initialPrompt?: string;
}

const STYLE_OPTIONS = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'casual', label: 'Casual' },
  { value: 'streetwear', label: 'Streetwear' },
  { value: 'luxury', label: 'Luxury' },
];

const SIZE_OPTIONS = [
  { value: '1024x1024', label: '1024×1024 (Square)' },
  { value: '2048x2048', label: '2048×2048 (High Res)' },
  { value: '1920x1080', label: '1920×1080 (Landscape)' },
  { value: '1080x1920', label: '1080×1920 (Portrait)' },
];

export function GeneratePanel({ onJobComplete, initialPrompt = '' }: GeneratePanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState('photorealistic');
  const [size, setSize] = useState('1024x1024');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError(null);
    setLoading(true);
    setJobStatus(null);

    try {
      const [width, height] = size.split('x').map(Number);
      
      const request = {
        prompt: prompt.trim(),
        style,
        width,
        height,
        negativePrompt: negativePrompt.trim() || undefined,
      };

      const { jobId: newJobId } = await createText2Img(request);
      setJobId(newJobId);

      // Poll for completion
      const finalStatus = await pollJobStatus(
        newJobId,
        (status) => setJobStatus(status),
        2000,
        120 // Max 4 minutes
      );

      setJobStatus(finalStatus);
      if (onJobComplete) {
        onJobComplete(finalStatus);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [prompt, style, size, negativePrompt, onJobComplete]);

  const handleReset = useCallback(() => {
    setJobId(null);
    setJobStatus(null);
    setError(null);
    setPrompt('');
    setNegativePrompt('');
  }, []);

  const getStatusText = () => {
    if (!jobStatus) return 'Ready to generate';
    switch (jobStatus.status) {
      case 'queued':
        return 'Queued...';
      case 'processing':
        return 'Generating...';
      case 'completed':
        return 'Completed!';
      case 'failed':
        return 'Failed';
      default:
        return jobStatus.status;
    }
  };

  const getProgressPercent = () => {
    if (!jobStatus) return 0;
    switch (jobStatus.status) {
      case 'queued':
        return 10;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="generate-panel">
      <div className="panel-header">
        <h2>AI Image Generator</h2>
        <p>Create stunning fashion images from text</p>
      </div>

      {/* Prompt Input */}
      <div className="form-group">
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate... e.g., 'Elegant navy blue blazer on model, professional studio lighting'"
          rows={4}
          disabled={loading}
        />
      </div>

      {/* Style Selector */}
      <div className="form-group">
        <label>Style</label>
        <div className="style-options">
          {STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`style-btn ${style === option.value ? 'active' : ''}`}
              onClick={() => setStyle(option.value)}
              disabled={loading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selector */}
      <div className="form-group">
        <label>Output Size</label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          disabled={loading}
        >
          {SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Negative Prompt */}
      <div className="form-group">
        <label htmlFor="negativePrompt">Negative Prompt (optional)</label>
        <input
          id="negativePrompt"
          type="text"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="What to avoid e.g., watermark, text, blurry"
          disabled={loading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Progress */}
      {loading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          <span className="progress-text">{getStatusText()}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        {!jobId || jobStatus?.status === 'completed' || jobStatus?.status === 'failed' ? (
          <button
            className="generate-btn primary"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        ) : null}
        
        {jobId && (
          <button
            className="generate-btn secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Create Another
          </button>
        )}
      </div>

      {/* Result Display */}
      {jobStatus?.status === 'completed' && jobStatus.resultUrl && (
        <div className="result-container">
          <h3>Generated Image</h3>
          <div className="result-image-wrapper">
            <img 
              src={jobStatus.resultUrl} 
              alt="Generated" 
              className="result-image"
            />
          </div>
          <div className="result-actions">
            <a 
              href={jobStatus.resultUrl} 
              download={`generated-${jobId}.png`}
              className="download-btn"
            >
              Download
            </a>
          </div>
        </div>
      )}

      <style>{`
        .generate-panel {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          max-width: 600px;
          margin: 0 auto;
        }

        .panel-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .panel-header h2 {
          margin: 0 0 8px;
          color: #1a1a2e;
          font-size: 24px;
        }

        .panel-header p {
          margin: 0;
          color: #666;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .form-group textarea,
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group textarea:focus,
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #7c3aed;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .style-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .style-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 20px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .style-btn:hover {
          border-color: #7c3aed;
        }

        .style-btn.active {
          background: #7c3aed;
          color: #fff;
          border-color: #7c3aed;
        }

        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .progress-container {
          margin: 20px 0;
        }

        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom:  }

        .progress8px;
       -fill {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #a855f7);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          color: #666;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
        }

        .generate-btn {
          padding: 14px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .generate-btn.primary {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: #fff;
        }

        .generate-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .generate-btn.secondary {
          background: #f3f4f6;
          color: #333;
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .result-container {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .result-container h3 {
          margin: 0 0 16px;
          color: #1a1a2e;
        }

        .result-image-wrapper {
          border-radius: 8px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .result-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .result-actions {
          margin-top: 16px;
          display: flex;
          gap: 12px;
        }

        .download-btn {
          display: inline-block;
          padding: 10px 20px;
          background: #7c3aed;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
        }

        .download-btn:hover {
          background: #6d28d9;
        }
      `}</style>
    </div>
  );
}

export default GeneratePanel;
