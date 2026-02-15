#!/usr/bin/env node
/**
 * Pre-warm trend cache before demo/judging.
 * Run: node scripts/prewarm-trends.js
 * Or: curl "http://localhost:5000/api/trends/fashion?category=all&limit=20&force=true"
 */
const BASE = process.env.API_BASE || 'http://localhost:5000';

async function prewarm() {
  const categories = ['all', 'clothing', 'colors', 'accessories', 'sustainable'];
  console.log('Pre-warming trend cache...');

  for (const cat of categories) {
    try {
      const url = `${BASE}/api/trends/fashion?category=${cat}&limit=12&force=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        console.log(`  ✓ ${cat}: ${data.data?.trends?.length ?? 0} trends`);
      } else {
        console.log(`  ✗ ${cat}: ${data.error || 'failed'}`);
      }
    } catch (e) {
      console.log(`  ✗ ${cat}: ${e.message}`);
    }
  }

  console.log('Done. Cache is warm for demo.');
}

prewarm().catch(console.error);
