export const fashionTrends = {
  query:
    "party fashion trends colors: white black categories: top bottom styles: casual 2026",
  trends: {
    trendingColors: ["lavender", "terracotta", "coral", "sage green", "butter yellow", "navy"],
    trendingCategories: ["dress", "top", "outerwear", "bottom"],
    trendingStyles: ["minimalist", "bohemian", "90s vintage", "quiet luxury", "coastal grandmother"],
    keywords: ["spring", "collection", "runway", "sustainable", "layering", "capsule wardrobe", "dopamine dressing"],
    sources: [
      {
        url: "https://vogue.com/spring-2026-trends",
        title: "Vogue: Spring 2026 Trends — The Definitive Guide",
        snippet: "From oversized blazers to lavender hues, here are the biggest trends dominating runways and streets this spring.",
      },
      {
        url: "https://elle.com/fashion-trends",
        title: "Elle: 15 Fashion Trends You'll See Everywhere in 2026",
        snippet: "Quiet luxury meets dopamine dressing in a season of contradictions. These are the key pieces to invest in now.",
      },
      {
        url: "https://harpersbazaar.com/trend-report",
        title: "Harper's Bazaar: Spring/Summer 2026 Trend Report",
        snippet: "Our editors pick the key pieces from Milan, Paris, and New York runways. Sustainable fabrics take center stage.",
      },
      {
        url: "https://whowhatwear.com/fashion-trends-2026",
        title: "Who What Wear: The 10 Trends That Actually Matter in 2026",
        snippet: "Skip the noise — these are the wearable trends real people will actually adopt this year.",
      },
      {
        url: "https://refinery29.com/en-us/fashion-trends-spring-2026",
        title: "Refinery29: Spring 2026's Biggest Trends, Ranked",
        snippet: "Butter yellow is the new beige, oversized everything is here to stay, and leather is going soft.",
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
    { itemId: "item-008", trendScore: 0.82 },
    { itemId: "item-009", trendScore: 0.55 },
    { itemId: "item-010", trendScore: 0.65 },
  ],
  insights: [
    "Your wardrobe has a strong mix of classic and on-trend pieces — you're well-positioned for spring.",
    "Hot colors right now: lavender, terracotta, coral, and butter yellow. Your floral dress aligns perfectly.",
    "Trending categories: dresses and outerwear. Your leather jacket and navy blazer score highly this season.",
    "Your floral dress is super trendy (score 85%)! Consider pairing it with your white sneakers for a street-style look.",
    "Pro tip: Layer your silk blouse under the navy blazer for a 'quiet luxury' outfit that's dominating Instagram.",
    "Sustainable fashion is huge — your linen and wool pieces align with the eco-conscious movement.",
  ],
};

export const demoTrendSearchResults: Record<string, {
  trends: { name: string; score: number; direction: string; description: string }[];
  sources: { url: string; title: string; snippet: string }[];
  insights: string[];
}> = {
  casual: {
    trends: [
      { name: "Oversized T-shirts", score: 92, direction: "up", description: "Relaxed fits continue to dominate casual wear. Think boxy silhouettes in neutral tones." },
      { name: "Wide-Leg Denim", score: 88, direction: "up", description: "Skinny jeans are officially out. Wide-leg and barrel-leg denim leads the pack." },
      { name: "Sneaker Culture", score: 85, direction: "stable", description: "Classic white sneakers remain a casual wardrobe staple. Chunky styles plateauing." },
      { name: "Linen Everything", score: 81, direction: "up", description: "Breathable, sustainable linen in casual pieces from shirts to shorts." },
    ],
    sources: [
      { url: "https://gq.com/casual-trends-2026", title: "GQ: The Casual Revolution of 2026", snippet: "How relaxed dressing became the new power move." },
      { url: "https://highsnobiety.com/spring-casual", title: "Highsnobiety: Spring Casual Done Right", snippet: "The best laid-back looks from street style around the world." },
    ],
    insights: [
      "Your white tee and blue jeans combo is the ultimate casual foundation piece.",
      "Consider adding a wide-leg denim to replace your skinny jeans — the silhouette shift is real.",
      "Your sneakers collection is on point for 2026's casual direction.",
    ],
  },
  party: {
    trends: [
      { name: "Sequin Revival", score: 95, direction: "up", description: "Full-on sparkle is back — sequin dresses, tops, and even pants are dominating nightlife." },
      { name: "Sheer Layers", score: 89, direction: "up", description: "Transparent fabrics layered over solid pieces create drama and depth." },
      { name: "Statement Accessories", score: 86, direction: "up", description: "Bold jewelry, oversized earrings, and chunky bracelets complete party looks." },
      { name: "Velvet Textures", score: 78, direction: "stable", description: "Rich velvet in jewel tones adds luxury to evening wear." },
    ],
    sources: [
      { url: "https://cosmopolitan.com/party-style-2026", title: "Cosmo: Party Style Guide 2026", snippet: "Every outfit formula you need for going out this season." },
      { url: "https://popsugar.com/nightlife-fashion", title: "PopSugar: Nightlife Fashion Trends", snippet: "From cocktail hours to dance floors — what to wear for every occasion." },
    ],
    insights: [
      "Your floral dress can be styled up for parties with bold accessories and heels.",
      "Layer your silk blouse with statement jewelry for an effortless party look.",
      "A leather jacket over a dress is the classic 'edgy party' formula that never fails.",
    ],
  },
  work: {
    trends: [
      { name: "Quiet Luxury", score: 93, direction: "up", description: "Understated elegance with premium fabrics. No logos, just quality." },
      { name: "Deconstructed Blazers", score: 90, direction: "up", description: "Relaxed-fit blazers with soft shoulders replace the structured power suit." },
      { name: "Tonal Dressing", score: 84, direction: "up", description: "Head-to-toe outfits in varying shades of one color look polished and intentional." },
      { name: "Ballet Flats", score: 80, direction: "up", description: "Comfortable yet chic — ballet flats replace heels in modern offices." },
    ],
    sources: [
      { url: "https://thecut.com/office-style-2026", title: "The Cut: Office Style Has Changed Forever", snippet: "The hybrid workplace has permanently altered how we dress for work." },
      { url: "https://bloomberg.com/workwear-trends", title: "Bloomberg: The Economics of Workwear", snippet: "How quiet luxury became the dress code of Wall Street." },
    ],
    insights: [
      "Your navy blazer is a 'quiet luxury' MVP — pair with silk blouse for maximum impact.",
      "Khaki chinos + silk blouse + navy blazer = the perfect modern work outfit.",
      "Invest in quality basics over logo pieces — the trend toward understated elegance is only growing.",
    ],
  },
  formal: {
    trends: [
      { name: "Column Dresses", score: 91, direction: "up", description: "Sleek, floor-length column silhouettes are the new formal standard." },
      { name: "Jewel Tones", score: 87, direction: "up", description: "Deep emerald, sapphire, and ruby replace classic black for formal occasions." },
      { name: "Tailored Jumpsuits", score: 83, direction: "up", description: "Modern alternatives to traditional formal dresses — chic and comfortable." },
      { name: "Minimalist Jewelry", score: 79, direction: "stable", description: "Fine, delicate pieces that add elegance without competing with the outfit." },
    ],
    sources: [
      { url: "https://townandcountry.com/formal-wear-2026", title: "Town & Country: Formal Wear for the Modern Era", snippet: "Black tie is evolving — here's what to wear to every formal occasion." },
    ],
    insights: [
      "Your leather jacket can even work for semi-formal events when paired with a column dress.",
      "Deep jewel tones would complement your warm undertone beautifully — consider adding emerald or sapphire pieces.",
    ],
  },
};

export const demoCustomSearchResults: Record<string, {
  query: string;
  trends: { name: string; score: number; direction: string; description: string }[];
  sources: { url: string; title: string; snippet: string }[];
  insights: string[];
}> = {
  "sustainable fashion": {
    query: "sustainable fashion",
    trends: [
      { name: "Capsule Wardrobes", score: 95, direction: "up", description: "Curating a minimal, versatile wardrobe reduces waste and decision fatigue." },
      { name: "Upcycled Denim", score: 89, direction: "up", description: "Repurposed and redesigned denim pieces are a creative, eco-friendly choice." },
      { name: "Natural Dyes", score: 82, direction: "up", description: "Plant-based and mineral dyes replace synthetic chemicals in conscious fashion." },
      { name: "Rental Fashion", score: 78, direction: "up", description: "Clothing rental services surge as consumers seek variety without ownership." },
    ],
    sources: [
      { url: "https://fashionrevolution.org/trends-2026", title: "Fashion Revolution: State of Sustainable Fashion 2026", snippet: "The annual report reveals significant progress in sustainable practices." },
      { url: "https://vogue.com/sustainability", title: "Vogue Sustainability: How Fashion is Going Green", snippet: "Major brands commit to carbon-neutral collections by 2028." },
    ],
    insights: [
      "ClosetAI helps you build a capsule wardrobe by analyzing what you already own — reducing impulse buys.",
      "Your existing wardrobe already has great mix-and-match potential. We found 15+ outfit combos from your current items.",
      "Re-wearing clothes is the most sustainable fashion choice. ClosetAI tracks your wear frequency to help.",
    ],
  },
  "street style": {
    query: "street style",
    trends: [
      { name: "Gorpcore", score: 93, direction: "up", description: "Outdoor and hiking-inspired fashion meets urban street style. Think utility vests and trail shoes." },
      { name: "Baggy Everything", score: 90, direction: "up", description: "Oversized silhouettes dominate from hoodies to cargo pants." },
      { name: "Layered Accessories", score: 85, direction: "up", description: "Stacking necklaces, rings, and bracelets creates personal style statements." },
      { name: "Retro Sneakers", score: 82, direction: "stable", description: "Vintage-inspired sneaker designs from the 80s and 90s remain hot." },
    ],
    sources: [
      { url: "https://hypebeast.com/street-style-2026", title: "Hypebeast: Street Style Report Spring 2026", snippet: "The most influential looks spotted outside fashion weeks worldwide." },
    ],
    insights: [
      "Your denim jacket + sneakers combo nails the street style aesthetic.",
      "Try layering your plaid shirt open over a white tee for an instant street-style upgrade.",
    ],
  },
};
