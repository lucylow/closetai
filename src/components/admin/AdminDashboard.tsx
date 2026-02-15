/**
 * Admin Dashboard: Perfect Corp credits, queue depth, recent jobs, GPU utilization.
 * Polls /api/admin/status every 10s. Requires ADMIN_TOKEN.
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function AdminDashboard() {
  const adminToken = import.meta.env.VITE_ADMIN_TOKEN || '';
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!adminToken) {
      setError('VITE_ADMIN_TOKEN not configured');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/status`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error(res.status === 403 ? 'Forbidden' : 'Failed to fetch status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 10_000);
    return () => clearInterval(t);
  }, []);

  if (loading && !status) return <div className="container py-8">Loading admin dashboard…</div>;
  if (error) return <div className="container py-8 text-destructive">Error: {error}</div>;
  if (!status) return null;

  const { perfectCorpCredits, queueCounts, recentJobs, gpuNodes, timestamp } = status;

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

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
