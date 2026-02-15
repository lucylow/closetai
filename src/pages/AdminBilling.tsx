/**
 * Admin billing & usage dashboard.
 * Requires ADMIN_TOKEN in Authorization header.
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminBilling() {
  const { token } = useAuth();
  const adminToken = import.meta.env.VITE_ADMIN_TOKEN || '';
  const [status, setStatus] = useState<{
    queueDepth?: number;
    lastStripeCredits?: string;
    perfectCorpCredits?: string;
    lastWorkerJob?: { id: string; type: string; state: string };
  } | null>(null);
  const [billing, setBilling] = useState<{
    queue?: { waiting: number; active: number; completed: number; failed: number };
    lastStripeCredits?: string;
    usersNearQuota?: Array<{ email: string; metric: string; total_value: string; limit_value: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headers = adminToken
      ? { Authorization: `Bearer ${adminToken}` }
      : token
        ? { Authorization: `Bearer ${token}` }
        : {};
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/status`, { headers });
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    const fetchBilling = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/billing`, { headers });
        if (!res.ok) throw new Error('Failed to fetch billing');
        const data = await res.json();
        setBilling(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    fetchStatus();
    fetchBilling();
    const t = setInterval(() => {
      fetchStatus();
      fetchBilling();
    }, 10000);
    return () => clearInterval(t);
  }, [adminToken, token]);

  if (error) {
    return (
      <div className="container py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!status && !billing) {
    return (
      <div className="container py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin Billing Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Queue Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{status?.queueDepth ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last Stripe Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {status?.lastStripeCredits ?? billing?.lastStripeCredits ?? '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Perfect Corp Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {status?.perfectCorpCredits ?? '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {billing?.queue && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe Usage Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Badge variant="outline">Waiting: {billing.queue.waiting}</Badge>
              <Badge variant="outline">Active: {billing.queue.active}</Badge>
              <Badge variant="outline">Completed: {billing.queue.completed}</Badge>
              <Badge variant="destructive">Failed: {billing.queue.failed}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {billing?.usersNearQuota && billing.usersNearQuota.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users Near Quota (90%+)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billing.usersNearQuota.map((u, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <span>{u.email}</span>
                  <span className="text-muted-foreground">
                    {u.metric}: {u.total_value} / {u.limit_value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {status?.lastWorkerJob && (
        <Card>
          <CardHeader>
            <CardTitle>Last Worker Job</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm">
              {JSON.stringify(status.lastWorkerJob, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
