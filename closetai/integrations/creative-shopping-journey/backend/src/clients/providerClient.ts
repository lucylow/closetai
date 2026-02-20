/**
 * Provider Client Stub
 * This file contains hooks for integrating with external providers
 * (PerfectCorp, trend APIs, affiliate APIs)
 */

const isDemo = process.env.INTEGRATION_MODE === 'demo';

/**
 * Generate recommendations from provider
 * TODO: Implement real provider integration when API keys are available
 */
export async function generateFromProvider(params: {
  seedItemIds: string[];
  context: { occasion?: string; weather?: string; vibe?: string };
  numResults: number;
}) {
  if (isDemo) {
    return null; // Demo mode uses fixtures
  }
  // TODO: Replace with real provider call
  // const response = await axios.post('https://api.provider.com/generate', params, {
  //   headers: { 'Authorization': `Bearer ${process.env.PROVIDER_API_KEY}` }
  // });
  throw new Error('Provider integration not implemented');
}

/**
 * Create try-on task with provider
 * TODO: Implement real provider integration when API keys are available
 */
export async function createTryOnWithProvider(params: {
  baseImageUrl: string;
  items: Array<{ sku: string; imageUrl: string }>;
  transforms?: { brightness?: number; scale?: number; rotation?: number };
}) {
  if (isDemo) {
    return null;
  }
  // TODO: Replace with real provider call
  // const response = await axios.post('https://api.perfectcorp.com/tryon', params, {
  //   headers: { 'Authorization': `Bearer ${process.env.PERFECT_CORP_API_KEY}` }
  // });
  throw new Error('Provider integration not implemented');
}

/**
 * Get trends from provider
 * TODO: Implement real provider integration when API keys are available
 */
export async function getTrendsFromProvider(query?: string) {
  if (isDemo) {
    return [];
  }
  // TODO: Replace with real provider call
  throw new Error('Provider integration not implemented');
}
