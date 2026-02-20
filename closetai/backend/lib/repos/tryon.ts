// eslint-disable-next-line @typescript-eslint/no-var-requires
const { query } = require('../db') as { query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[] }> };

export interface TryOnJob {
  id: string;
  user_id: string | null;
  brand_id: string | null;
  job_status: string;
  category: string | null;
  selfie_key: string | null;
  garment_keys: string[] | null;
  result_key: string | null;
  confidence: number | null;
  processing_ms: number | null;
  device_info: Record<string, any> | null;
  created_at: Date;
  completed_at: Date | null;
}

export async function createTryOnJob(params: {
  userId?: string;
  brandId?: string;
  category?: string;
  selfieKey?: string;
  garmentKeys?: string[];
  deviceInfo?: Record<string, any>;
}): Promise<TryOnJob> {
  const { rows } = await query<TryOnJob>(
    `INSERT INTO tryon_jobs (user_id, brand_id, category, selfie_key, garment_keys, device_info)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      params.userId ?? null,
      params.brandId ?? null,
      params.category ?? null,
      params.selfieKey ?? null,
      params.garmentKeys ?? null,
      params.deviceInfo ? JSON.stringify(params.deviceInfo) : null,
    ]
  );
  return rows[0];
}

export async function getTryOnJob(jobId: string): Promise<TryOnJob | null> {
  const { rows } = await query<TryOnJob>(
    `SELECT * FROM tryon_jobs WHERE id = $1`,
    [jobId]
  );
  return rows[0] ?? null;
}

export async function listRecentTryOnJobs(
  userId: string,
  limit = 20
): Promise<TryOnJob[]> {
  const { rows } = await query<TryOnJob>(
    `SELECT * FROM tryon_jobs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

export async function updateTryOnJobStatus(
  jobId: string,
  status: string,
  extras?: {
    resultKey?: string;
    confidence?: number;
    processingMs?: number;
  }
): Promise<TryOnJob | null> {
  const sets = ['job_status = $2'];
  const params: any[] = [jobId, status];
  let idx = 3;

  if (extras?.resultKey !== undefined) {
    sets.push(`result_key = $${idx++}`);
    params.push(extras.resultKey);
  }
  if (extras?.confidence !== undefined) {
    sets.push(`confidence = $${idx++}`);
    params.push(extras.confidence);
  }
  if (extras?.processingMs !== undefined) {
    sets.push(`processing_ms = $${idx++}`);
    params.push(extras.processingMs);
  }
  if (status === 'completed' || status === 'failed') {
    sets.push(`completed_at = now()`);
  }

  const { rows } = await query<TryOnJob>(
    `UPDATE tryon_jobs SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function getTryOnStats(userId: string): Promise<{
  total: number;
  completed: number;
  avgConfidence: number | null;
}> {
  const { rows } = await query<{
    total: string;
    completed: string;
    avg_confidence: string | null;
  }>(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE job_status = 'completed') AS completed,
       AVG(confidence) FILTER (WHERE confidence IS NOT NULL) AS avg_confidence
     FROM tryon_jobs
     WHERE user_id = $1`,
    [userId]
  );
  return {
    total: parseInt(rows[0].total, 10),
    completed: parseInt(rows[0].completed, 10),
    avgConfidence: rows[0].avg_confidence
      ? parseFloat(rows[0].avg_confidence)
      : null,
  };
}
