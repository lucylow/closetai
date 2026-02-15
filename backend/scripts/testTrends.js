/**
 * Quick test script for You.com fashion trend integration.
 * Run: node scripts/testTrends.js (from backend directory)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const trendService = require('../services/trendService');

async function testFashionTrends() {
  console.log('Testing fashion trend research...\n');

  const categories = ['all', 'colors', 'clothing', 'sustainable'];

  for (const category of categories) {
    console.log(`=== Testing ${category} trends ===`);
    try {
      const trends = await trendService.getCurrentTrends(category, 'spring', 5);
      console.log(`Found ${trends.trends.length} trends`);
      console.log('Sources:', trends.sources?.length ?? 0);

      if (trends.trends.length > 0) {
        console.log('Sample trend:', trends.trends[0].title);
        const insight = trends.trends[0].insights?.[0];
        if (insight) console.log('Sample insight:', insight.text?.slice(0, 80) + '...');
      }
      console.log('');
    } catch (error) {
      console.error(`Failed for ${category}:`, error.message);
      console.log('');
    }
  }

  console.log('Done.');
}

testFashionTrends();
