/**
 * TryOn Service Test
 * 
 * Tests the try-on service in DEMO_MODE
 * Run with: npm test -- tests/tryon.service.test.js
 */

const { Pool } = require('pg');

// Mock dependencies
jest.mock('../lib/redisClient', () => ({
  get: jest.fn(),
  set: jest.fn()
}));

jest.mock('../lib/queue', () => ({
  enqueueJob: jest.fn().mockResolvedValue({ id: 'job-123' })
}));

describe('TryOn Service (DEMO_MODE)', () => {
  let pool;
  
  beforeAll(async () => {
    // Set DEMO_MODE before importing
    process.env.DEMO_MODE = 'true';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 
      'postgres://dev:dev@localhost:5432/closetai';
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Run migrations first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wardrobe_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category TEXT,
        color TEXT[],
        tags TEXT[],
        attributes JSONB,
        embedding_id UUID,
        last_worn TIMESTAMPTZ,
        wear_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS tryon_artifacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        key TEXT UNIQUE NOT NULL,
        image_url TEXT NOT NULL,
        sponsor TEXT,
        params JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );
    `);
  });
  
  afterAll(async () => {
    await pool.end();
  });
  
  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tryon_artifacts WHERE key LIKE $1', ['%test-%']);
  });
  
  it('should return demo fixture in DEMO_MODE', async () => {
    // Import after setting DEMO_MODE
    const { generateTryOn } = require('../services/tryOnService');
    
    const result = await generateTryOn({ 
      userId: 'test-user-1', 
      itemIds: ['test-item-1'], 
      params: {} 
    });
    
    expect(result).toHaveProperty('imageUrl');
    expect(result).toHaveProperty('cached');
    expect(result.imageUrl).toContain('/fixtures/');
  });
  
  it('should write tryon_artifacts record', async () => {
    const { generateTryOn } = require('../services/tryOnService');
    
    await generateTryOn({ 
      userId: 'test-user-2', 
      itemIds: ['test-item-2'], 
      params: {} 
    });
    
    const result = await pool.query(
      'SELECT * FROM tryon_artifacts WHERE user_id = $1',
      ['test-user-2']
    );
    
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].sponsor).toBe('demo');
  });
});
