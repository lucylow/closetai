// Simple API wrapper for frontend
const BASE = '/api';

async function fetchJson(path: string, opts: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  const text = await res.text();
  try { 
    return JSON.parse(text); 
  } catch (e) { 
    return text; 
  }
}

export default {
  get: (path: string) => fetchJson(path, { method: 'GET' }),
  post: (path: string, body?: unknown) => fetchJson(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body?: unknown) => fetchJson(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => fetchJson(path, { method: 'DELETE' })
};
