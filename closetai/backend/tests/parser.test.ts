import { parseHtmlForContent } from '../src/services/ingest/parser';
import fs from 'fs';
import path from 'path';

test('parse sample blog post', () => {
  const html = fs.readFileSync(path.join(__dirname, '../fixtures/html/sample_blog_post.html'), 'utf8');
  const parsed = parseHtmlForContent('file://sample', html);
  expect(parsed.title.toLowerCase()).toContain('neon trench');
  expect(parsed.hashtags).toBeDefined();
});
