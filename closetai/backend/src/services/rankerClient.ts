import axios from 'axios';
import { RANKER_SERVER_URL } from '../lib/env';
import logger from '../lib/logger';

// Send features for list of candidates to ranker server
export async function scoreCandidates(userFeatures:any, candidates:any[]) {
  try {
    const res = await axios.post(`${RANKER_SERVER_URL}/score`, { user: userFeatures, candidates }, { timeout: 20000 });
    return res.data.scores;
  } catch (err:any) {
    logger.error('rankerClient error', err.message);
    // fallback: simple scoring based on candidate.score (from retrieval)
    return candidates.map((c:any)=>c.score ?? 0);
  }
}
