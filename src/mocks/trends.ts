// mocks/trends.ts
export const fashionTrends = {
  query:
    "party fashion trends colors: white black categories: top bottom styles: casual 2026",
  trends: {
    trendingColors: ["lavender", "terracotta", "coral", "sage green"],
    trendingCategories: ["dress", "top", "outerwear"],
    trendingStyles: ["minimalist", "bohemian", "90s vintage"],
    keywords: ["spring", "collection", "runway", "sustainable", "layering"],
    sources: [
      {
        url: "https://vogue.com/spring-2026-trends",
        title: "Vogue: Spring 2026 Trends",
        snippet: "The biggest trends for spring include...",
      },
      {
        url: "https://elle.com/fashion-trends",
        title: "Elle: What to Wear Now",
        snippet: "From the runways to your closet...",
      },
      {
        url: "https://harpersbazaar.com/trend-report",
        title: "Harper's Bazaar Trend Report",
        snippet: "Our editors pick the key pieces...",
      },
    ],
  },
  scoredItems: [
    { itemId: "item-001", trendScore: 0.3 },
    { itemId: "item-002", trendScore: 0.5 },
    { itemId: "item-003", trendScore: 0.85 },
    { itemId: "item-004", trendScore: 0.75 },
    { itemId: "item-005", trendScore: 0.6 },
    { itemId: "item-006", trendScore: 0.4 },
    { itemId: "item-007", trendScore: 0.7 },
  ],
  insights: [
    "Your wardrobe has a good mix of classic and trendy items.",
    "Hot colors right now: lavender, terracotta, coral.",
    "Trending categories: dress, outerwear. You might want to explore more dresses.",
    "Your floral dress is super trendy (score 85%)!",
  ],
};
