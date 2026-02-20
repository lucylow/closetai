/**
 * TryOn Service
 * 
 * Orchestrates virtual try-on, caching, and queueing
 * DEMO_MODE returns fixture images without external API calls
 */

const db = require('../lib/db');
const { enqueueJob } = require('../lib/queue');
const logger = require('../lib/logger');
const path = require('path');
const fs = require('fs');

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const TRYON_CACHE_PREFIX = 'tryon:';

/**
 * Get cached try-on result
 */
async function getCachedTryOn(key) {
  const res = await db.query(
    'SELECT image_url, expires_at FROM tryon_artifacts WHERE key=$1 LIMIT 1', 
    [key]
  );
  
  const row = res.rows[0];
  if (!row) return null;
  
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await db.query('DELETE FROM tryon_artifacts WHERE key=$1', [key]);
    return null;
  }
  
  return row.image_url;
}

/**
 * Generate try-on result
 * In DEMO_MODE, returns fixture path immediately
 * Otherwise, enqueues job for async processing
 */
async function generateTryOn({ userId, itemIds, userPhotoUrl, params = {} }) {
  const key = `${TRYON_CACHE_PREFIX}${userId}:${itemIds.sort().join(',')}:${JSON.stringify(params)}`;
  
  // Check cache first
  const cached = await getCachedTryOn(key);
  if (cached) {
    return { imageUrl: cached, cached: true };
  }
  
  // In DEMO_MODE, return fixture
  if (DEMO_MODE) {
    const fixturePath = `/fixtures/tryon/tryon_demo_${itemIds[0] || '1'}.jpg`;
    const fullPath = path.join(process.cwd(), 'backend', fixturePath);
    
    // Check if fixture exists, otherwise use placeholder
    const fixtureExists = fs.existsSync(fullPath);
    const finalPath = fixtureExists ? fixturePath : '/fixtures/tryon/tryon_demo_1.jpg';
    
    // Insert metadata
    await db.query(`
      INSERT INTO tryon_artifacts (user_id, key, image_url, sponsor, params, created_at, expires_at) 
      VALUES ($1, $2, $3, $4, $5, now(), now() + interval '7 days') 
      ON CONFLICT (key) DO UPDATE SET image_url=EXCLUDED.image_url, created_at=now()
    `, [userId, key, finalPath, 'demo', params]);
    
    return { imageUrl: finalPath, cached: false };
  }
  
  // Enqueue heavy job for production
  const job = await enqueueJob('tryon', { userId, itemIds, userPhotoUrl, params, key });
  
  return { imageUrl: null, cached: false, jobId: job.id };
}

/**
 * Clear try-on cache for a user
 */
async function clearTryOnCache(userId) {
  await db.query('DELETE FROM tryon_artifacts WHERE user_id = $1', [userId]);
}

/**
 * Get try-on cache stats
 */
async function getTryOnStats() {
  const result = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN expires_at > now() THEN 1 END) as active,
      COUNT(CASE WHEN sponsor = 'demo' THEN 1 END) as demo
    FROM tryon_artifacts
  `);
  
  return result.rows[0];
}

module.exports = {
  generateTryOn,
  getCachedTryOn,
  clearTryOnCache,
  getTryOnStats
};
