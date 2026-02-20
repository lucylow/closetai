export const tryOnResults: Record<string, string> = {
  "model-default-garment-003": "/images/wardrobe/floral-dress.jpg",
  "model-default-garment-004": "/images/wardrobe/leather-jacket.jpg",
  "model-default-garment-001+002+005": "/images/wardrobe/white-tee.jpg",
};

export const userPhoto = "/images/wardrobe/silk-blouse.jpg";

export const demoTryOnResults = [
  {
    id: "demo-result-001",
    garmentName: "Leather Jacket",
    garmentImage: "/images/wardrobe/leather-jacket.jpg",
    resultImage: "/images/wardrobe/leather-jacket.jpg",
    timestamp: "2026-02-18T14:30:00Z",
    rating: 4.5,
    occasion: "Night Out",
    style: "Edgy Chic",
  },
  {
    id: "demo-result-002",
    garmentName: "Floral Dress",
    garmentImage: "/images/wardrobe/floral-dress.jpg",
    resultImage: "/images/wardrobe/floral-dress.jpg",
    timestamp: "2026-02-17T11:15:00Z",
    rating: 5,
    occasion: "Brunch",
    style: "Bohemian",
  },
  {
    id: "demo-result-003",
    garmentName: "Navy Blazer",
    garmentImage: "/images/wardrobe/navy-blazer.jpg",
    resultImage: "/images/wardrobe/navy-blazer.jpg",
    timestamp: "2026-02-16T09:00:00Z",
    rating: 4,
    occasion: "Work Meeting",
    style: "Professional",
  },
  {
    id: "demo-result-004",
    garmentName: "Denim Jacket",
    garmentImage: "/images/wardrobe/denim-jacket.jpg",
    resultImage: "/images/wardrobe/denim-jacket.jpg",
    timestamp: "2026-02-15T16:45:00Z",
    rating: 4.5,
    occasion: "Weekend",
    style: "Casual Cool",
  },
];

export const demoTryOnStats = {
  totalTryOns: 47,
  avgRating: 4.3,
  topGarment: "Leather Jacket",
  topOccasion: "Casual",
  weeklyTryOns: [5, 8, 3, 7, 6, 9, 9],
  categoryBreakdown: {
    top: 15,
    bottom: 8,
    outerwear: 12,
    dress: 7,
    shoes: 3,
    accessory: 2,
  },
};

export const demoSkinAnalysis = {
  skinTone: {
    name: "Warm Olive",
    hex: "#C8A17A",
    undertone: "warm",
    season: "Autumn",
  },
  bestColors: [
    { name: "Terracotta", hex: "#E2725B" },
    { name: "Sage Green", hex: "#9DC183" },
    { name: "Warm Cream", hex: "#F5E6D3" },
    { name: "Deep Burgundy", hex: "#722F37" },
    { name: "Camel", hex: "#C19A6B" },
    { name: "Dusty Rose", hex: "#DCAE96" },
  ],
  avoidColors: [
    { name: "Neon Pink", hex: "#FF6EC7" },
    { name: "Ice Blue", hex: "#99E5FF" },
    { name: "Bright Orange", hex: "#FF8C00" },
  ],
  concerns: [
    { type: "Hydration", score: 78, recommendation: "Skin looks well-hydrated. Maintain current routine." },
    { type: "Texture", score: 85, recommendation: "Smooth complexion detected. Light exfoliation weekly." },
    { type: "Dark Circles", score: 65, recommendation: "Mild under-eye darkness. Consider vitamin C serum." },
    { type: "Pores", score: 72, recommendation: "Normal pore size. Niacinamide can help minimize." },
  ],
};

export const demoMeasurements = {
  height: 170,
  weight: 65,
  bust: 88,
  chest: 90,
  waist: 72,
  hips: 95,
  shoulder: 42,
  inseam: 78,
  sizeRecommendation: {
    tops: "M",
    bottoms: "M / 29",
    dresses: "8 (US) / 40 (EU)",
    shoes: "8 (US) / 39 (EU)",
  },
};
