/**
 * TryOnViewer - Virtual Try-On UI component
 * Allows users to upload a photo and try on garments from their wardrobe
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  createTryon,
  pollJobStatus,
  getUploadUrl,
  uploadToSignedUrl,
  JobStatus,
} from '../../services/gen.service';

interface TryOnViewerProps {
  onTryonComplete?: (job: JobStatus) => void;
  initialPersonImageKey?: string;
  initialItemImageKey?: string;
}

interface UploadedImage {
  key: string;
  url: string;
}

const CATEGORY_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'dress', label: 'Dress' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessory', label: 'Accessory' },
];

const FIT_OPTIONS = [
  { value: 'standard', label: 'Standard Fit' },
  { value: 'slim', label: 'Slim Fit' },
  { value: 'loose', label: 'Loose Fit' },
];

export function TryOnViewer({ onTryonComplete, initialPersonImageKey, initialItemImageKey }: TryOnViewerProps) {
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [itemImage, setItemImage] = useState<UploadedImage | null>(null);
  const [category, setCategory] = useState('top');
  const [fit, setFit] = useState('standard');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  
  const personFileRef = useRef<HTMLInputElement>(null);
  const itemFileRef = useRef<HTMLInputElement>(null);

  const handlePersonUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Get signed URL
      const { key, uploadUrl } = await getUploadUrl(
        file.name,
        file.type,
        'uploads/person'
      );

      // Upload to S3
      await uploadToSignedUrl(file, uploadUrl, file.type);

      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setPersonImage({ key, url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleItemUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Get signed URL
      const { key, uploadUrl } = await getUploadUrl(
        file.name,
        file.type,
        'uploads/items'
      );

      // Upload to S3
      await uploadToSignedUrl(file, uploadUrl, file.type);

      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setItemImage({ key, url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleTryon = useCallback(async () => {
    if (!personImage?.key || !itemImage?.key) {
      setError('Please upload both person and item images');
      return;
    }

    if (!consent) {
      setShowConsentModal(true);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create try-on job
      const { jobId: newJobId } = await createTryon({
        personImageKey: personImage.key,
        itemImageKey: itemImage.key,
        category,
        fit,
      });

      setJobId(newJobId);

      // Poll for completion
      const finalStatus = await pollJobStatus(
        newJobId,
        (status) => setJobStatus(status),
        2000,
        120 // Max 4 minutes
      );

      setJobStatus(finalStatus);
      if (onTryonComplete) {
        onTryonComplete(finalStatus);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Try-on failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [personImage, itemImage, category, fit, consent, onTryonComplete]);

  const handleConsentConfirm = useCallback(async () => {
    setConsent(true);
    setShowConsentModal(false);
    // Trigger try-on after consent
    await handleTryon();
  }, [handleTryon]);

  const handleReset = useCallback(() => {
    setPersonImage(null);
    setItemImage(null);
    setJobId(null);
    setJobStatus(null);
    setError(null);
    setConsent(false);
    if (personFileRef.current) personFileRef.current.value = '';
    if (itemFileRef.current) itemFileRef.current.value = '';
  }, []);

  const getStatusText = () => {
    if (!jobStatus) return 'Ready to try on';
    switch (jobStatus.status) {
      case 'queued':
        return 'Queued...';
      case 'processing':
        return 'Processing your try-on...';
      case 'completed':
        return 'Try-on complete!';
      case 'failed':
        return 'Try-on failed';
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
    <div className="tryon-viewer">
      <div className="panel-header">
        <h2>Virtual Try-On</h2>
        <p>See how clothes look on you before buying</p>
      </div>

      <div className="upload-sections">
        {/* Person Photo Upload */}
        <div className="upload-section">
          <h3>Your Photo</h3>
          <div className="upload-area">
            {personImage ? (
              <div className="preview-container">
                <img src={personImage.url} alt="You" className="preview-image" />
                <button 
                  className="remove-btn"
                  onClick={() => {
                    setPersonImage(null);
                    if (personFileRef.current) personFileRef.current.value = '';
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="upload-label">
                <input
                  ref={personFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePersonUpload}
                  disabled={uploading}
                />
                <div className="upload-placeholder">
                  {uploading ? 'Uploading...' : 'Tap to upload your photo'}
                </div>
              </label>
            )}
          </div>
          <p className="upload-hint">Upload a full-body photo for best results</p>
        </div>

        {/* Garment Photo Upload */}
        <div className="upload-section">
          <h3>Garment to Try On</h3>
          <div className="upload-area">
            {itemImage ? (
              <div className="preview-container">
                <img src={itemImage.url} alt="Garment" className="preview-image" />
                <button 
                  className="remove-btn"
                  onClick={() => {
                    setItemImage(null);
                    if (itemFileRef.current) itemFileRef.current.value = '';
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="upload-label">
                <input
                  ref={itemFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleItemUpload}
                  disabled={uploading}
                />
                <div className="upload-placeholder">
                  {uploading ? 'Uploading...' : 'Tap to upload garment'}
                </div>
              </label>
            )}
          </div>
          <p className="upload-hint">Upload a photo of the clothing item</p>
        </div>
      </div>

      {/* Options */}
      <div className="options-section">
        <div className="option-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label>Fit Preference</label>
          <select
            value={fit}
            onChange={(e) => setFit(e.target.value)}
            disabled={loading}
          >
            {FIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="consent-section">
        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={loading}
          />
          <span>
            I consent to processing my photo for virtual try-on. 
            My photo will be processed securely and not shared with third parties.
          </span>
        </label>
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
            className="tryon-btn primary"
            onClick={handleTryon}
            disabled={loading || !personImage?.key || !itemImage?.key}
          >
            {loading ? 'Processing...' : 'Try It On'}
          </button>
        ) : null}
        
        {jobId && (
          <button
            className="tryon-btn secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Try Another
          </button>
        )}
      </div>

      {/* Result Display */}
      {jobStatus?.status === 'completed' && jobStatus.resultUrl && (
        <div className="result-container">
          <h3>Your Try-On Result</h3>
          <div className="result-image-wrapper">
            <img 
              src={jobStatus.resultUrl} 
              alt="Try-on result" 
              className="result-image"
            />
          </div>
          <div className="result-actions">
            <a 
              href={jobStatus.resultUrl} 
              download={`tryon-${jobId}.png`}
              className="download-btn"
            >
              Download
            </a>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="modal-overlay">
          <div className="consent-modal">
            <h3>Consent Required</h3>
            <p>
              Virtual try-on requires processing your photo through our AI service.
              Your photo will be:
            </p>
            <ul>
              <li>Processed securely using Perfect Corp's AI technology</li>
              <li>Stored temporarily for generation purposes only</li>
              <li>Not shared with third parties or used for other purposes</li>
              <li>Automatically deleted after processing (within 30 days)</li>
            </ul>
            <p className="consent-note">
              By clicking "I Consent", you agree to this processing.
            </p>
            <div className="modal-buttons">
              <button 
                className="modal-btn cancel"
                onClick={() => setShowConsentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm"
                onClick={handleConsentConfirm}
              >
                I Consent
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tryon-viewer {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          max-width: 700px;
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

        .upload-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .upload-section h3 {
          margin: 0 0 12px;
          font-size: 16px;
          color: #333;
        }

        .upload-area {
          border: 2px dashed #ddd;
          border-radius: 8px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .upload-label {
          width: 100%;
          height: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-label input {
          display: none;
        }

        .upload-placeholder {
          color: #999;
          font-size: 14px;
        }

        .preview-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }

        .upload-hint {
          margin: 8px 0 0;
          font-size: 12px;
          color: #999;
        }

        .options-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .option-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .option-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .consent-section {
          margin-bottom: 20px;
        }

        .consent-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .consent-checkbox input {
          margin-top: 3px;
        }

        .consent-checkbox span {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
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
          margin-bottom: 8px;
        }

        .progress-fill {
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

        .tryon-btn {
          padding: 14px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tryon-btn.primary {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: #fff;
        }

        .tryon-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .tryon-btn.secondary {
          background: #f3f4f6;
          color: #333;
        }

        .tryon-btn:disabled {
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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .consent-modal {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          margin: 20px;
        }

        .consent-modal h3 {
          margin: 0 0 16px;
          color: #1a1a2e;
        }

        .consent-modal p {
          margin: 0 0 12px;
          color: #666;
          line-height: 1.5;
        }

        .consent-modal ul {
          margin: 0 0 16px;
          padding-left: 20px;
          color: #666;
        }

        .consent-modal li {
          margin-bottom: 6px;
        }

        .consent-note {
          font-size: 13px;
          color: #999;
          font-style: italic;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .modal-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-btn.cancel {
          background: #f3f4f6;
          color: #666;
        }

        .modal-btn.confirm {
          background: #7c3aed;
          color: #fff;
        }

        @media (max-width: 640px) {
          .upload-sections {
            grid-template-columns: 1fr;
          }

          .options-section {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default TryOnViewer;
