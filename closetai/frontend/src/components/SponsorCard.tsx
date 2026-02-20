import React from 'react';

export type Sponsor = {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  connected: boolean;
  mode?: 'live' | 'demo' | 'none';
};

interface SponsorCardProps {
  sponsor: Sponsor;
  onConnect: (id: string) => void;
  onTest: (id: string) => void;
  onUse: (id: string) => void;
}

export default function SponsorCard({ sponsor, onConnect, onTest, onUse }: SponsorCardProps) {
  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <div className="flex items-center gap-3">
        <img 
          src={sponsor.logoUrl} 
          alt={`${sponsor.name} logo`} 
          className="w-12 h-12 object-contain"
          onError={(e) => {
            // Fallback to text if image fails
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div>
          <div className="font-semibold">{sponsor.name}</div>
          <div className="text-sm text-gray-500">{sponsor.description}</div>
        </div>
        <div className="ml-auto">
          <span className={`px-2 py-1 rounded-full text-xs ${
            sponsor.connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {sponsor.connected 
              ? (sponsor.mode === 'demo' ? 'Connected (demo)' : 'Connected') 
              : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button 
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => onConnect(sponsor.id)}
        >
          Connect
        </button>
        <button 
          className="px-3 py-1 border rounded hover:bg-gray-50 transition-colors"
          onClick={() => onTest(sponsor.id)}
          disabled={!sponsor.connected}
        >
          Test
        </button>
        <button 
          className="px-3 py-1 border rounded ml-auto text-sm hover:bg-gray-50 transition-colors"
          onClick={() => onUse(sponsor.id)}
        >
          Use
        </button>
      </div>
    </div>
  );
}
