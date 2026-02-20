import { Recommendation, TryonTask, SeedItem, Trend, GenerateRequest, TryonRequest } from './types';

const API_BASE = '/api/creative';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  async generate(request: GenerateRequest) {
    return fetchJson<{ requestId: string; status: string; results: Recommendation[] }>(`${API_BASE}/generate`, {
      method: 'POST', body: JSON.stringify(request),
    });
  },

  async createTryOn(request: TryonRequest) {
    return fetchJson<{ taskId: string; status: string }>(`${API_BASE}/tryon`, {
      method: 'POST', body: JSON.stringify(request),
    });
  },

  async getTryOnResult(taskId: string): Promise<TryonTask> {
    return fetchJson<TryonTask>(`${API_BASE}/tryon/${taskId}`);
  },

  async saveRecommendation(request: { userId: string; recommendationId: string; title?: string; notes?: string }) {
    return fetchJson<{ success: boolean }>(`${API_BASE}/save`, {
      method: 'POST', body: JSON.stringify(request),
    });
  },

  async getSeedItems(userId?: string) {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return fetchJson<{ items: SeedItem[] }>(`${API_BASE}/seed-items${params}`);
  },

  async getTrends(query?: string) {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    return fetchJson<{ trends: Trend[] }>(`${API_BASE}/trends${params}`);
  },
};
