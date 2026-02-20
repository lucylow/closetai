/**
 * Creative Shopping Journey Service
 */
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface Recommendation {
  id: string;
  score: number;
  items: Array<{ sku: string; name: string; imageUrl: string; colorHex?: string }>;
  outfitImageUrl?: string;
  caption?: string;
  hashtags?: string[];
  rationale?: string;
  costEstimate?: { total: number; currency: string };
  source: 'market' | 'affiliate' | 'internal';
}

export interface TryonTask {
  taskId: string;
  status: 'pending' | 'success' | 'error';
  result?: { compositeUrl: string; masks: { [sku: string]: string } };
}

let metrics = { generateCount: 0, tryonCount: 0, saveCount: 0 };
const DEMO_FIXTURE_DIR = process.env.DEMO_FIXTURE_DIR || './backend/fixtures';

function loadDemoRecommendations(): Recommendation[] {
  try {
    const filePath = path.join(DEMO_FIXTURE_DIR, 'recommendations_demo.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) { console.error('Error loading demo recommendations:', e); }
  return [];
}

function loadDemoTryon(taskId: string): TryonTask {
  try {
    const filePath = path.join(DEMO_FIXTURE_DIR, '
