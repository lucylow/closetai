import { getItemEmbeddings } from './featureStore';
import logger from '../lib/logger';

// naive brute-force kNN for demo
export function cosine(a:number[], b:number[]) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const na = Math.sqrt(a.reduce((s,v)=>s+v*v,0));
  const nb = Math.sqrt(b.reduce((s,v)=>s+v*v,0));
  return dot / (na * nb + 1e-10);
}

export async function retrieveCandidates(queryVector:number[], k=20) {
  const items = await getItemEmbeddings(2000); // small demo limit
  const scored = items.map((r:any) => ({ item_id: r.item_id, score: cosine(queryVector, r.vector) }));
  scored.sort((a:any,b:any)=>b.score-a.score);
  return scored.slice(0, k);
}
