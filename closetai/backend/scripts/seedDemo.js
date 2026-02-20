/**
 * Seed Demo Data Script
 * 
 * Creates a demo user and sample wardrobe items for testing
 * Run with: node scripts/seedDemo.js
 * 
 * This script is for local development and demo purposes only
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    `postgres://${process.env.DB_USER || 'dev'}:${process.env.DB_PASSWORD || 'dev'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'closetai'}`
});

// Demo user ID (use a fixed UUID for consistency)
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// Sample wardrobe items for demo
const DEMO_WARDROBE_ITEMS = [
  { category: 'top', color: ['blue'], tags: ['casual', 'summer'], image: '/fixtures/wardrobe/top1.jpg' },
  { category: 'top', color: ['white'], tags: ['formal', 'work'], image: '/fixtures/wardrobe/top2.jpg' },
  { category: 'bottom', color: ['black'], tags: ['casual'], image: '/fixtures/wardrobe/bottom1.jpg' },
  { category: 'bottom', color: ['navy'], tags: ['formal'], image: '/fixtures/wardrobe/bottom2.jpg' },
  { category: 'outerwear', color: ['beige'], tags: ['casual', 'winter'], image: '/fixtures/wardrobe/outerwear1.jpg' },
  { category: 'shoes', color: ['brown'], tags: ['casual'], image: '/fixtures/wardrobe/shoes1.jpg' },
];

async function seedDemo() {
  const client = await pool.connect();
  
  try {
    console.log('Starting demo seed...');
    
    // Create demo user if not exists
    await client.query(`
      INSERT INTO users (id, email, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, [DEMO_USER_ID, 'demo@example.com', 'Demo User', 'user']);
    console.log('✓ Demo user created/verified');
    
    // Create wardrobe items
    for (const item of DEMO_WARDROBE_ITEMS) {
      await client.query(`
        INSERT INTO wardrobe_items (user_id, image_url, thumbnail_url, category, color, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [DEMO_USER_ID, item.image, item.image, item.category, item.color, item.tags]);
    }
    console.log(`✓ Created ${DEMO_WARDROBE_ITEMS.length} demo wardrobe items`);
    
    // Create sample outfits
    const itemsResult = await client.query(
      'SELECT id, category FROM wardrobe_items WHERE user_id = $1',
      [DEMO_USER_ID]
    );
    
    const tops = itemsResult.rows.filter(i => i.category === 'top');
    const bottoms = itemsResult.rows.filter(i => i.category === 'bottom');
    
    if (tops.length > 0 && bottoms.length > 0) {
      await client.query(`
        INSERT INTO outfits (user_id, name, item_ids, occasion, score)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        DEMO_USER_ID,
        'Casual Summer Look',
        [tops[0].id, bottoms[0].id],
        'casual',
        0.85
      ]);
      console.log('✓ Created sample outfit');
    }
    
    console.log('\n========================================');
    console.log('Demo data seeded successfully!');
    console.log('========================================');
    console.log(`Demo user email: demo@example.com`);
    console.log(`Demo user ID: ${DEMO_USER_ID}`);
    console.log('\nYou can now:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Access API at http://localhost:5000');
    console.log('3. Use the demo user for testing');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemo()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDemo, DEMO_USER_ID };
