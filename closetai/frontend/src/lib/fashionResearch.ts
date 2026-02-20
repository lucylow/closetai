/**
 * Fashion Research API - Frontend service for You.com APIs
 * Provides access to Search, News, and Content APIs for real-time fashion trend research
 */
import api from './api';

/**
 * Fetch real-time fashion trends
 * @param query - Search query (default: 'latest fashion trends 2026')
 * @param limit - Number of results (default: 10)
 */
export async function getFashionTrends(query = 'latest fashion trends 2026', limit = 10) {
  return api.get(`/trends?q=${encodeURIComponent(query)}&limit=${limit}`);
}

/**
 * Fetch fashion trends with citations (source URLs, snippets)
 * @param category - Category filter (default: 'fashion')
 * @param limit - Number of results (default: 15)
 */
export async function getTrendsWithCitations(category = 'fashion', limit = 15) {
  return api.get(`/trends/with-citations?category=${category}&limit=${limit}`);
}

/**
 * Fetch latest fashion news using You.com News API
 * @param query - Search query (default: 'fashion trends 2026')
 * @param limit - Number of results (default: 10)
 * @param freshness - Time filter: 'day', 'week', 'month' (default: 'week')
 */
export async function getFashionNews(query = 'fashion trends 2026', limit = 10, freshness = 'week') {
  return api.get(`/trends/news?q=${encodeURIComponent(query)}&limit=${limit}&freshness=${freshness}`);
}

/**
 * Extract article content using You.com Content API
 * @param url - URL of the article to extract
 */
export async function getArticleContent(url: string) {
  return api.get(`/trends/content?url=${encodeURIComponent(url)}`);
}

/**
 * Search for specific fashion trends
 * @param query - Search query
 * @param limit - Number of results (default: 10)
 */
export async function searchTrends(query: string, limit = 10) {
  return api.get(`/trends/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

/**
 * Get personalized trend report based on user's wardrobe
 * @param occasion - Optional occasion filter
 */
export async function getUserTrendReport(occasion?: string) {
  const query = occasion ? `?occasion=${encodeURIComponent(occasion)}` : '';
  return api.get(`/fashion/report${query}`);
}

/**
 * Get trend-aware outfit recommendations
 * @param wardrobe - Array of wardrobe items
 * @param occasion - Occasion type (default: 'casual')
 * @param weather - Weather conditions
 */
export async function getTrendAwareOutfits(wardrobe: unknown[], occasion = 'casual', weather = {}) {
  return api.post('/trends/outfits/trend-aware', { wardrobe, occasion, weather });
}

export default {
  getFashionTrends,
  getTrendsWithCitations,
  getFashionNews,
  getArticleContent,
  searchTrends,
  getUserTrendReport,
  getTrendAwareOutfits,
};
