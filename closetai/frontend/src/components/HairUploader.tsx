import React, { useState } from 'react';

interface HairUploaderProps {
  onUpload: (file: File, taskTypes: string[]) => Promise<void>;
  loading?: boolean;
}

export const HairUploader: React.FC<HairUploaderProps> = ({ onUpload, loading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [taskTypes, setTaskTypes] = useState<string[]>(['hair_color_tryon']);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file || !consent) return;
    await onUpload(file, taskTypes);
  };

  const taskTypeOptions = [
    { value: 'hair_color_tryon', label: 'Hair Color Try-On' },
    { value: 'hairstyle_generation', label: 'Hairstyle Generation' },
    { value: 'hair_type_detection', label: 'Hair Type Detection' },
    { value: 'bangs_generation', label: 'Bangs Generation' },
    { value: 'beard_generation', label: 'Beard Generation' },
  ];

  return (
    <div className="hair-uploader">
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && <img src={preview} alt="Preview" className="preview-image" />}
      </div>
      
      <div className="task-selector">
        <h4>Select Features:</h4>
        {taskTypeOptions.map(opt => (
          <label key={opt.value}>
            <input
              type="checkbox"
              checked={taskTypes.includes(opt.value)}
              onChange={(e) => {
                if (e.target.checked) {
                  setTaskTypes([...taskTypes, opt.value]);
                } else {
                  setTaskTypes(taskTypes.filter(t => t !== opt.value));
                }
              }}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="consent-section">
        <label>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          I consent to having my photo analyzed for hair features
        </label>
      </div>

      <button onClick={handleSubmit} disabled={!file || !consent || loading}>
        {loading ? 'Analyzing...' : 'Analyze Hair'}
      </button>
    </div>
  );
};

export default HairUploader;
