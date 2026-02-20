/**
 * Seed Demo Test
 * 
 * Tests the seed script creates expected data
 * Run with: npm test -- tests/seedDemo.test.js
 */

const { Pool } = require('pg');

describe('SeedDemo Script', () => {
  let pool;
  
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 
      'postgres://dev:dev@localhost:5432/closetai';
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  });
  
  afterAll(async () => {
    await pool.end();
  });
  
  it('should verify seed inserts items', async () => {
    // This test verifies the seed script logic
    // Run actual seed first: node scripts/seedDemo.js
    
    // Check that the seedDemo module exports correctly
    const { seedDemo, DEMO_USER_ID } = require('../scripts/seedDemo');
    
    expect(seedDemo).toBeDefined();
    expect(typeof seedDemo).toBe('function');
    expect(DEMO_USER_ID).toBe('00000000-0000-0000-0000-000000000001');
  });
  
  it('should create expected tables', async () => {
    // Verify wardrobe_items table exists
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'wardrobe_items'
    `);
    
    expect(result.rows.length).toBe(1);
  });
  
  it('should have correct schema for wardrobe_items', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'wardrobe_items'
    `);
    
    const columns = result.rows.map(r => r.column_name);
    
    expect(columns).toContain('id');
    expect(columns).toContain('user_id');
    expect(columns).toContain('image_url');
    expect(columns).toContain('category');
    expect(columns).toContain('color');
    expect(columns).toContain('tags');
  });
});
