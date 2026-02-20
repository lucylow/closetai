import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AdminStatus {
  ok?: boolean;
  perfectCorpCredits?: string | null;
  queueCounts?: {
    waiting?: number;
    active?: number;
    delayed?: number;
    failed?: number;
    completed?: number;
    paused?: number;
  } | null;
  recentJobs?: Array<{ id: string; name: string; state: string }>;
  gpuNodes?: Array<{ name: string; gpu: string }> | null;
  timestamp?: string;
}

const DEMO_STATUS: AdminStatus = {
  ok: true,
  perfectCorpCredits: '8,742',
  queueCounts: { waiting: 2, active: 1, delayed: 0, failed: 3, completed: 1847, paused: 0 },
  recentJobs: [
    { id: 'job_7f3a', name: 'tryon_process', state: 'completed' },
    { id: 'job_8b2c', name: 'skin_analysis', state: 'completed' },
    { id: 'job_9d1e', name: 'image_resize', state: 'active' },
    { id: 'job_a4f0', name: 'aging_simulation', state: 'queued' },
  ],
  gpuNodes: [
    { name: 'gpu-node-1', gpu: '2' },
    { name: 'gpu-node-2', gpu: '4' },
  ],
  timestamp: new Date().toISOString(),
};

export default function AdminDashboard() {
  const adminToken = import.meta.env.VITE_ADMIN_TOKEN || '';
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/status`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setStatus(data);
      setIsDemo(false);
    } catch {
      setStatus({ ...DEMO_STATUS, timestamp: new Date().toISOString() });
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 30_000);
    return () => clearInterval(t);
  }, []);

  if (loading && !status) return <div className="container py-8">Loading admin dashboard...</div>;
  if (!status) return null;

  const { perfectCorpCredits, queueCounts, recentJobs, gpuNodes, timestamp } = status;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        {isDemo && (
          <Badge variant="secondary" className="text-xs">Demo Data</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Perfect Corp Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{perfectCorpCredits ?? 'unknown'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {timestamp ? new Date(timestamp).toLocaleTimeString() : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>Waiting: {queueCounts?.waiting ?? '—'}</div>
            <div>Active: {queueCounts?.active ?? '—'}</div>
            <div>Delayed: {queueCounts?.delayed ?? '—'}</div>
            <div>Failed: {queueCounts?.failed ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GPU Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            {gpuNodes && gpuNodes.length > 0 ? (
              <ul className="text-sm space-y-1">
                {gpuNodes.map((n) => (
                  <li key={n.name}>
                    {n.name} — allocatable GPUs: {n.gpu}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No GPU nodes detected</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2">State</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs && recentJobs.length > 0 ? (
                recentJobs.map((j) => (
                  <tr key={j.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{j.id}</td>
                    <td className="py-2 pr-4">{j.name}</td>
                    <td className="py-2">{j.state}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-muted-foreground">
                    No jobs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
