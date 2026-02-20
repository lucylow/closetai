import { aggregateDailyTrendSignals } from '../src/services/trends/trendExtractor';
import db from '../src/db';

jest.setTimeout(20000);

test('trend aggregation runs without crashing', async () => {
  // create demo dataset entry and content item
  await db.query("INSERT INTO datasets (dataset_id, name, manifest) VALUES ($1,$2,$3) ON CONFLICT (dataset_id) DO NOTHING", ['demo-trends-001','Demo', {}]);
  const datasetRow = await db.query("SELECT id FROM datasets WHERE dataset_id=$1", ['demo-trends-001']);
  const datasetId = datasetRow.rows[0].id;
  await db.query('INSERT INTO content_items (dataset_id, source, source_id, canonical_url, title, body, excerpt, publish_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [datasetId, 'demo', 'cid1', 'http://example', 'test', 'neon trench neon', 'neon', new Date()]);
  await aggregateDailyTrendSignals('demo-trends-001');
  // check trend_signals inserted
  const res = await db.query('SELECT count(*) FROM trend_signals');
  expect(Number(res.rows[0].count)).toBeGreaterThanOrEqual(1);
});