const API_BASE = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function getToken(): string | null {
  return localStorage.getItem('closetai_token');
}

function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (includeAuth && token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().then((body) => {
      const msg = body?.error || res.statusText || 'Request failed';
      const err = new Error(msg) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }).catch((e) => {
      if (e instanceof Error && 'status' in e) throw e;
      throw new Error(res.statusText || 'Request failed');
    });
  }
  return res.json();
}

/** Retry fetch for transient failures (5xx, network errors) */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = DEFAULT_RETRIES
): Promise<Response> {
  try {
    const res = await fetch(url, init);
    const isRetryable = res.status >= 500 || res.status === 429;
    if (isRetryable && retries > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return fetchWithRetry(url, init, retries - 1);
    }
    return res;
  } catch (e) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return fetchWithRetry(url, init, retries - 1);
    }
    throw e;
  }
}

export const api = {
  async post<T>(path: string, body?: unknown, auth = true): Promise<T> {
    const res = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async get<T>(path: string, auth = true): Promise<T> {
    const res = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'GET',
      headers: getHeaders(auth),
    });
    return handleResponse<T>(res);
  },

  async patch<T>(path: string, body?: unknown, auth = true): Promise<T> {
    const res = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(path: string, auth = true): Promise<T> {
    const res = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: getHeaders(auth),
    });
    return handleResponse<T>(res);
  },

  async blob(path: string, body?: unknown, auth = true): Promise<Blob> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string })?.error || res.statusText || 'Request failed');
    }
    return res.blob();
  },

  async upload<T>(path: string, file: File, extra?: Record<string, string>): Promise<T> {
    const form = new FormData();
    form.append('image', file);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => form.append(k, v));
    }
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    const res = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: form,
    });
    return handleResponse<T>(res);
  },
};

export function getImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';
  return base ? `${base}${url}` : url;
}

export type AuthResponse = { user: { id: string; email: string }; token: string };
export type WardrobeItemResponse = {
  id: string;
  imageUrl: string;
  imageKey?: string;
  extractedAttributes: { category?: string; color?: string; pattern?: string; style?: string };
  userTags: string[];
  wearCount: number;
  lastWornDate: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  createdAt: string;
};
export type OutfitSuggestionResponse = {
  id: string;
  items: WardrobeItemResponse[];
  occasion: string;
  description: string;
  totalScore: number;
  trend: string;
};
