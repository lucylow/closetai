import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DEMO_STATUS = {
  queueDepth: 3,
  lastStripeCredits: '$2,450.00',
  perfectCorpCredits: '8,742',
  lastWorkerJob: { id: 'job_a1b2c3', type: 'tryon_process', state: 'completed' },
};

const DEMO_BILLING = {
  queue: { waiting: 2, active: 1, completed: 1847, failed: 12 },
  lastStripeCredits: '$2,450.00',
  usersNearQuota: [
    { email: 'sarah@example.com', metric: 'try-ons', total_value: '47', limit_value: '50' },
    { email: 'alex@brand.co', metric: 'API calls', total_value: '920', limit_value: '1000' },
  ],
};

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
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const headers: Record<string, string> = adminToken
      ? { Authorization: `Bearer ${adminToken}` }
      : token
        ? { Authorization: `Bearer ${token}` }
        : {};

    let cancelled = false;

    const fetchData = async () => {
      try {
        const [statusRes, billingRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/status`, { headers }),
          fetch(`${API_BASE}/api/admin/billing`, { headers }),
        ]);

        if (!statusRes.ok || !billingRes.ok) throw new Error('API unavailable');

        if (!cancelled) {
          setStatus(await statusRes.json());
          setBilling(await billingRes.json());
          setIsDemo(false);
        }
      } catch {
        if (!cancelled) {
          setStatus(DEMO_STATUS);
          setBilling(DEMO_BILLING);
          setIsDemo(true);
          setError(null);
        }
      }
    };

    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [adminToken, token]);

  if (!status && !billing && !isDemo) {
    return (
      <div className="container py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Admin Billing Dashboard</h1>
        {isDemo && (
          <Badge variant="secondary" className="text-xs">Demo Data</Badge>
        )}
      </div>

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
