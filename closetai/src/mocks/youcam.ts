export const skinAnalysisResponse = {
  requestId: "demo-skin-req-001",
  status: "success",
  skinTone: {
    name: "Warm Olive (K-12)",
    hex: "#C8A17A",
    undertone: "warm",
    lightness: 0.62,
    melaninIndex: 0.48,
    season: "Autumn",
  },
  concernsDetected: [
    { type: "wrinkles", score: 0.12, label: "Fine Lines", recommendation: "Minimal concern. Retinol serum can help prevent." },
    { type: "texture", score: 0.25, label: "Skin Texture", recommendation: "Slightly uneven. AHA/BHA exfoliant 2x weekly." },
    { type: "dark_circles", score: 0.08, label: "Dark Circles", recommendation: "Very minimal. Adequate sleep and vitamin C serum." },
    { type: "pores", score: 0.32, label: "Pore Visibility", recommendation: "Normal range. Niacinamide serum helps minimize." },
    { type: "hydration", score: 0.78, label: "Hydration Level", recommendation: "Well-hydrated skin detected. Maintain current routine." },
    { type: "elasticity", score: 0.85, label: "Skin Elasticity", recommendation: "Excellent elasticity. SPF daily to maintain." },
  ],
  recommendedPalettes: [
    { name: "Earth Warm", colors: ["#6e4ae0", "#c8a17a", "#a46d2a", "#2b2b2b"], description: "Rich earth tones that complement your warm undertone" },
    { name: "Muted Teal", colors: ["#00c9b7", "#8ec6c6", "#3a6b6b", "#f6f0fc"], description: "Cool jewel tones for contrast and pop" },
    { name: "Neutral Core", colors: ["#ffffff", "#222222", "#9f9f9f", "#e3dcd8"], description: "Timeless neutrals that work with everything" },
    { name: "Autumn Harvest", colors: ["#E2725B", "#C19A6B", "#9DC183", "#722F37"], description: "Seasonal colors ideal for your undertone" },
    { name: "Sunset Glow", colors: ["#FF7F50", "#FFD700", "#DCAE96", "#8B4513"], description: "Warm, glowing shades for a radiant look" },
  ],
  makeupRecommendations: {
    foundation: { shade: "Warm Sand 320", finish: "Satin", brand: "Suggested match" },
    lipColors: [
      { name: "Terracotta Nude", hex: "#C66B4A" },
      { name: "Berry Wine", hex: "#722F37" },
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Coral Kiss", hex: "#FF7F50" },
    ],
    eyeShadow: [
      { name: "Bronze Shimmer", hex: "#CD7F32" },
      { name: "Sage Matte", hex: "#9DC183" },
      { name: "Plum Smoke", hex: "#8E4585" },
    ],
    blush: { name: "Peach Glow", hex: "#FFDAB9" },
  },
  notes: "Skin analysis is simulated for demo. Powered by Perfect Corp YouCam AI technology.",
};

export const tryOnTaskResponse = {
  taskId: "demo-tryon-001",
  status: "queued",
  estimatedSeconds: 2,
  message: "Task queued; processing with Perfect Corp AI engine...",
};

export const tryOnResultResponse = {
  taskId: "demo-tryon-001",
  status: "success",
  compositeUrl: "/images/wardrobe/leather-jacket.jpg",
  processingTime: 1.8,
  confidence: 0.94,
  masks: {
    "BR-001": "/images/wardrobe/navy-blazer.jpg",
    "BR-010": "/images/wardrobe/blue-jeans.jpg",
  },
};

export const genImageResponse = {
  requestId: "genimg-demo-001",
  status: "success",
  generatedImages: [
    { id: "g1", url: "/images/wardrobe/navy-blazer.jpg", style: "editorial-film" },
    { id: "g2", url: "/images/wardrobe/silk-blouse.jpg", style: "street-photography" },
    { id: "g3", url: "/images/wardrobe/floral-dress.jpg", style: "fashion-editorial" },
  ],
  promptUsed: "Create editorial image of structured blazer + high-rise jeans in rainy urban street, soft film look",
};

export const demoVirtualTryOnGallery = [
  {
    id: "vto-001",
    garment: "Leather Jacket",
    category: "outerwear",
    garmentImage: "/images/wardrobe/leather-jacket.jpg",
    resultImage: "/images/wardrobe/leather-jacket.jpg",
    fitScore: 92,
    styleNotes: "Perfect edge for a night out. Pairs well with slim jeans.",
    timestamp: "2026-02-18T14:30:00Z",
  },
  {
    id: "vto-002",
    garment: "Floral Dress",
    category: "dress",
    garmentImage: "/images/wardrobe/floral-dress.jpg",
    resultImage: "/images/wardrobe/floral-dress.jpg",
    fitScore: 88,
    styleNotes: "Flattering bohemian silhouette. Great for brunch or garden parties.",
    timestamp: "2026-02-17T11:15:00Z",
  },
  {
    id: "vto-003",
    garment: "Navy Blazer",
    category: "outerwear",
    garmentImage: "/images/wardrobe/navy-blazer.jpg",
    resultImage: "/images/wardrobe/navy-blazer.jpg",
    fitScore: 95,
    styleNotes: "Excellent professional fit. The quiet luxury trend in action.",
    timestamp: "2026-02-16T09:00:00Z",
  },
  {
    id: "vto-004",
    garment: "Silk Blouse",
    category: "top",
    garmentImage: "/images/wardrobe/silk-blouse.jpg",
    resultImage: "/images/wardrobe/silk-blouse.jpg",
    fitScore: 90,
    styleNotes: "Elegant drape. Works tucked or untucked for versatile styling.",
    timestamp: "2026-02-15T16:45:00Z",
  },
];

export const demoAIGeneratedOutfits = [
  {
    id: "aigen-001",
    prompt: "Editorial outfit: blazer + denim in urban rain",
    style: "editorial-film",
    imageUrl: "/images/wardrobe/navy-blazer.jpg",
    items: ["Navy Blazer", "Blue Jeans", "White Sneakers"],
    occasion: "Street Style",
    rating: 4.8,
  },
  {
    id: "aigen-002",
    prompt: "Bohemian summer: floral dress with accessories",
    style: "fashion-editorial",
    imageUrl: "/images/wardrobe/floral-dress.jpg",
    items: ["Floral Dress", "Sunglasses", "Summer Hat"],
    occasion: "Brunch",
    rating: 4.6,
  },
  {
    id: "aigen-003",
    prompt: "Business casual: silk top with tailored bottom",
    style: "professional-portrait",
    imageUrl: "/images/wardrobe/silk-blouse.jpg",
    items: ["Silk Blouse", "Khaki Chinos", "Black Boots"],
    occasion: "Work",
    rating: 4.9,
  },
  {
    id: "aigen-004",
    prompt: "Weekend edge: leather + denim layered look",
    style: "street-photography",
    imageUrl: "/images/wardrobe/leather-jacket.jpg",
    items: ["Leather Jacket", "White T-shirt", "Black Jeans"],
    occasion: "Weekend",
    rating: 4.7,
  },
];

export const demoAPIStats = {
  totalAPICallsToday: 156,
  tryOnRequests: 47,
  skinAnalysisRequests: 23,
  imageGenerations: 31,
  measurementScans: 12,
  avgResponseTime: "1.8s",
  successRate: 98.7,
  creditsRemaining: 8420,
  creditsUsedToday: 580,
  plan: "Enterprise",
  endpoints: [
    { name: "Virtual Try-On", method: "POST", path: "/api/tryon", calls: 47, avgLatency: "2.1s", status: "healthy" },
    { name: "Skin Analysis", method: "POST", path: "/api/skin-analysis", calls: 23, avgLatency: "1.5s", status: "healthy" },
    { name: "AI Image Gen", method: "POST", path: "/api/tryon/generate-image", calls: 31, avgLatency: "3.2s", status: "healthy" },
    { name: "Measurements", method: "POST", path: "/api/tryon/measure", calls: 12, avgLatency: "0.8s", status: "healthy" },
    { name: "Share Result", method: "POST", path: "/api/tryon/share", calls: 43, avgLatency: "0.3s", status: "healthy" },
  ],
};
