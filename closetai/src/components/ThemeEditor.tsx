import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeEditor() {
  const { tokens } = useTheme();
  
  if (!tokens) {
    return <div>Loading theme...</div>;
  }

  return (
    <div className="theme-editor p-6">
      <h2 className="text-2xl font-bold mb-4">Theme Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Primary Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="color" 
              value={tokens['color.primary']} 
              readOnly 
              className="w-10 h-10"
            />
            <span>{tokens['color.primary']}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Accent Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="color" 
              value={tokens['color.accent']} 
              readOnly 
              className="w-10 h-10"
            />
            <span>{tokens['color.accent']}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Background</label>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="color" 
              value={tokens['color.background']} 
              readOnly 
              className="w-10 h-10"
            />
            <span>{tokens['color.background']}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Text Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="color" 
              value={tokens['color.text']} 
              readOnly 
              className="w-10 h-10"
            />
            <span>{tokens['color.text']}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
