import React, { useState, useEffect } from 'react';
import api from '../lib/api';

interface ConnectModalProps {
  sponsorId: string;
  onClose: () => void;
  onConnect: () => void;
}

export default function ConnectModal({ sponsorId, onClose, onConnect }: ConnectModalProps) {
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Focus trap for accessibility
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/api/sponsors/connect', { 
        id: sponsorId, 
        mode, 
        apiKey: mode === 'live' ? apiKey : null 
      });
      onConnect();
      onClose();
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 id="modal-title" className="text-lg font-semibold mb-2">
          Connect {sponsorId}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose demo or live mode. For demo you can connect without real keys.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Mode</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as 'demo' | 'live')} 
            className="w-full p-2 border rounded-md"
          >
            <option value="demo">Demo (no key required)</option>
            <option value="live">Live (paste API key)</option>
          </select>
        </div>

        {mode === 'live' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              className="w-full p-2 border rounded-md"
              placeholder="sk-..."
              type="password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Do not paste production keys for a judge demo. Use DEMO_MODE in backend.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button 
            onClick={handleConnect} 
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
