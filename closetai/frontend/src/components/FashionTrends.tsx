import React, { useState, useEffect } from 'react';
import {
  getFashionTrends,
  getFashionNews,
  getArticleContent,
  searchTrends,
} from '../lib/fashionResearch';

interface Trend {
  name: string;
  score: number;
  direction: string;
  description: string;
}

interface NewsItem {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}

interface Source {
  url: string;
  title: string;
  snippet: string;
}

/**
 * FashionTrends Component
 * Displays real-time fashion trends, news, and allows article content extraction
 * using You.com Search, News, and Content APIs
 */
export function FashionTrends() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingNews, setLoadingNews] = useState(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'news'>('trends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Trend[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // Fetch trends on mount
  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    setLoadingTrends(true);
    try {
      const data = await getFashionTrends('latest fashion trends 2026', 10);
      if (data.trends) {
        setTrends(data.trends);
      }
      if (data.sources) {
        setSources(data.sources);
      }
    } catch (error) {
      console.error('Failed to load trends:', error);
    } finally {
      setLoadingTrends(false);
    }
  };

  const loadNews = async () => {
    setLoadingNews(true);
    try {
      const data = await getFashionNews('fashion trends 2026', 10, 'week');
      if (data.news) {
        setNews(data.news);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoadingTrends(true);
    try {
      const data = await searchTrends(searchQuery, 10);
      if (data.data?.trends) {
        setSearchResults(data.data.trends);
      }
    } catch (error) {
      console.error('Failed to search trends:', error);
    } finally {
      setLoadingTrends(false);
    }
  };

  const handleExtractContent = async (url: string) => {
    setSelectedArticle(url);
    setLoadingContent(true);
    setArticleContent(null);
    try {
      const data = await getArticleContent(url);
      if (data.content) {
        // Extract text from the content response
        setArticleContent(data.content.text || data.content.summary || JSON.stringify(data.content, null, 2));
      }
    } catch (error) {
      console.error('Failed to extract content:', error);
      setArticleContent('Failed to load article content.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleTabChange = (tab: 'trends' | 'news') => {
    setActiveTab(tab);
    if (tab === 'news' && news.length === 0) {
      loadNews();
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="fashion-trends-container p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fashion Trend Research</h1>
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for specific trends..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loadingTrends}
            className="px-6 py--none focus:ring2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingTrends ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => handleTabChange('trends')}
          className={`pb-2 px-4 ${activeTab === 'trends' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Real-Time Trends
        </button>
        <button
          onClick={() => handleTabChange('news')}
          className={`pb-2 px-4 ${activeTab === 'news' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Fashion News
        </button>
      </div>

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="trends-tab">
          {loadingTrends ? (
            <div className="text-center py-8 text-gray-500">Loading trends...</div>
          ) : (
            <>
              <div className="grid gap-4 mb-6">
                {(searchResults.length > 0 ? searchResults : trends).map((trend, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{trend.name}</h3>
                      <span className={`text-sm font-medium ${getDirectionColor(trend.direction)}`}>
                        {getDirectionIcon(trend.direction)} {trend.score}%
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{trend.description}</p>
                  </div>
                ))}
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Sources</h3>
                  <div className="grid gap-2">
                    {sources.map((source, index) => (
                      <div key={index} className="text-sm">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {source.title}
                        </a>
                        <p className="text-gray-500 text-xs">{source.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="news-tab">
          {loadingNews ? (
            <div className="text-center py-8 text-gray-500">Loading news...</div>
          ) : (
            <div className="grid gap-4">
              {news.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-blue-600 hover:underline"
                    >
                      {item.title}
                    </a>
                    <span className="text-xs text-gray-500">{item.source}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{item.snippet}</p>
                  <div className="flex gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Read Article →
                    </a>
                    <button
                      onClick={() => handleExtractContent(item.url)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Extract Content
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Article Content Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Article Content</h3>
              <button
                onClick={() => {
                  setSelectedArticle(null);
                  setArticleContent(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {loadingContent ? (
              <div className="text-center py-8 text-gray-500">Extracting content...</div>
            ) : articleContent ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{articleContent}</pre>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No content available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FashionTrends;
