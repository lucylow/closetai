import express, { Request, Response } from 'express';
import { embedText, embedImage } from '../services/embeddings';
import { retrieveCandidates } from '../services/candidateGenerator';
import { scoreCandidates } from '../services/rankerClient';
import { upsertUser } from '../services/featureStore';
import logger from '../lib/logger';

const router = express.Router();

// POST /api/recommend
// body: { anon_id, context_text?, image_url?, k? }
router.post('/', async (req: Request, res: Response) => {
  const { anon_id, context_text, image_url, k=5 } = req.body;
  try {
    const userId = await upsertUser({ anon_id, preferences: {} });
    // build query vector
    let qvec: any = null;
    if (image_url) qvec = await embedImage(image_url);
    else if (context_text) qvec = await embedText(context_text);
    else qvec = await embedText('default'); // fallback
    const candidates = await retrieveCandidates(qvec, 50);
    const scores = await scoreCandidates({ userId }, candidates);
    // combine and return top-k with simple explainability
    const scored = candidates.map((c: any, i: number)=>({ item_id: c.item_id, base_score: c.score, ranker_score: scores[i] ?? 0, combined_score: (c.score + (scores[i] ?? 0)) / 2 }));
    scored.sort((a: any,b: any)=>b.combined_score - a.combined_score);
    res.json({ ok:true, recommendations: scored.slice(0,k) });
  } catch (err: any) {
    logger.error('recommend error', err.message);
    res.status(500).json({ ok:false, error: err.message });
  }
});

export default router;
