import { useEffect, useState } from 'react';
import SponsorCard, { Sponsor } from '../components/SponsorCard';
import ConnectModal from '../components/ConnectModal';
import api from '../lib/api';

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [showModalFor, setShowModalFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/sponsors/list');
      setSponsors(res.sponsors || []);
    } catch (err) {
      console.error('Failed to load sponsors:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleConnect(id: string) {
    setShowModalFor(id);
  }

  async function handleTest(id: string) {
    try {
      const r = await api.post('/sponsors/test', { id });
      alert('Test result for ' + id + ': ' + JSON.stringify(r));
      await load();
    } catch (err) {
      alert('Test failed for ' + id);
    }
  }

  async function handleUse(id: string) {
    alert('Using sponsor ' + id + ' (demo)');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Sponsor Integrations</h1>
      <p className="text-sm text-gray-600 mt-1">
        Connect sponsors to enable enhanced features (try-on, search, generation, payment).
      </p>

      {loading ? (
        <div className="mt-6 text-gray-500">Loading sponsors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {sponsors.map((s) => (
            <SponsorCard 
              key={s.id} 
              sponsor={s} 
              onConnect={handleConnect} 
              onTest={handleTest} 
              onUse={handleUse} 
            />
          ))}
        </div>
      )}

      {showModalFor && (
        <ConnectModal 
          sponsorId={showModalFor} 
          onClose={() => setShowModalFor(null)} 
          onConnect={load}
        />
      )}
    </div>
  );
}
