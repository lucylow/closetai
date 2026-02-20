// mocks/wardrobe.ts
/**
 * Mock wardrobe items – each represents a clothing item in the user's closet.
 * Fields correspond to the database model (WardrobeItem).
 */
export const mockWardrobeItems = [
  {
    id: "item-001",
    userId: "user-123",
    imageUrl: "/images/wardrobe/white-tee.jpg",
    imageKey: "user-123/whit-tee.jpg",
    extractedAttributes: {
      category: "top",
      color: "white",
      pattern: "solid",
      style: "casual",
      confidence: 0.98,
    },
    userTags: ["favorite", "everyday"],
    wearCount: 23,
    lastWornDate: "2026-02-10",
    purchaseDate: "2025-12-01",
    purchasePrice: 29.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.sin(i) * 0.5),
    createdAt: "2025-12-01T10:30:00Z",
    updatedAt: "2026-02-10T08:15:00Z",
  },
  {
    id: "item-002",
    userId: "user-123",
    imageUrl: "/images/wardrobe/black-jeans.jpg",
    imageKey: "user-123/black-jeans.jpg",
    extractedAttributes: {
      category: "bottom",
      color: "black",
      pattern: "solid",
      style: "casual",
      confidence: 0.95,
    },
    userTags: ["favorite", "work"],
    wearCount: 45,
    lastWornDate: "2026-02-12",
    purchaseDate: "2025-10-10",
    purchasePrice: 59.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.cos(i) * 0.6),
    createdAt: "2025-10-10T14:20:00Z",
    updatedAt: "2026-02-12T09:45:00Z",
  },
  {
    id: "item-003",
    userId: "user-123",
    imageUrl: "/images/wardrobe/floral-dress.jpg",
    imageKey: "user-123/floral-dress.jpg",
    extractedAttributes: {
      category: "dress",
      color: "pink",
      pattern: "floral",
      style: "bohemian",
      confidence: 0.92,
    },
    userTags: ["party", "summer"],
    wearCount: 8,
    lastWornDate: "2025-12-31",
    purchaseDate: "2025-11-15",
    purchasePrice: 89.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.sin(i * 2) * 0.4),
    createdAt: "2025-11-15T11:10:00Z",
    updatedAt: "2025-12-31T20:30:00Z",
  },
  {
    id: "item-004",
    userId: "user-123",
    imageUrl: "/images/wardrobe/leather-jacket.jpg",
    imageKey: "user-123/leather-jacket.jpg",
    extractedAttributes: {
      category: "outerwear",
      color: "brown",
      pattern: "solid",
      style: "edgy",
      confidence: 0.96,
    },
    userTags: ["favorite", "night-out"],
    wearCount: 12,
    lastWornDate: "2026-02-05",
    purchaseDate: "2025-09-20",
    purchasePrice: 149.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.cos(i * 1.5) * 0.7),
    createdAt: "2025-09-20T16:45:00Z",
    updatedAt: "2026-02-05T22:10:00Z",
  },
  {
    id: "item-005",
    userId: "user-123",
    imageUrl: "/images/wardrobe/sneakers.jpg",
    imageKey: "user-123/sneakers.jpg",
    extractedAttributes: {
      category: "shoes",
      color: "white",
      pattern: "solid",
      style: "sporty",
      confidence: 0.97,
    },
    userTags: ["everyday", "workout"],
    wearCount: 67,
    lastWornDate: "2026-02-13",
    purchaseDate: "2025-08-05",
    purchasePrice: 79.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.8) * 0.5),
    createdAt: "2025-08-05T09:30:00Z",
    updatedAt: "2026-02-13T07:20:00Z",
  },
  {
    id: "item-006",
    userId: "user-123",
    imageUrl: "/images/wardrobe/wool-scarf.jpg",
    imageKey: "user-123/scarf.jpg",
    extractedAttributes: {
      category: "accessory",
      color: "gray",
      pattern: "plaid",
      style: "casual",
      confidence: 0.88,
    },
    userTags: ["winter", "cozy"],
    wearCount: 5,
    lastWornDate: "2026-01-20",
    purchaseDate: "2025-12-10",
    purchasePrice: 24.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.cos(i * 2.2) * 0.3),
    createdAt: "2025-12-10T13:15:00Z",
    updatedAt: "2026-01-20T18:40:00Z",
  },
  {
    id: "item-007",
    userId: "user-123",
    imageUrl: "/images/wardrobe/navy-blazer.jpg",
    imageKey: "user-123/blazer.jpg",
    extractedAttributes: {
      category: "outerwear",
      color: "navy",
      pattern: "solid",
      style: "formal",
      confidence: 0.94,
    },
    userTags: ["work", "formal"],
    wearCount: 18,
    lastWornDate: "2026-02-08",
    purchaseDate: "2025-07-22",
    purchasePrice: 129.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.sin(i * 1.2) * 0.6),
    createdAt: "2025-07-22T10:00:00Z",
    updatedAt: "2026-02-08T08:30:00Z",
  },
  {
    id: "item-008",
    userId: "user-123",
    imageUrl: "/images/wardrobe/silk-blouse.jpg",
    imageKey: "user-123/silk-blouse.jpg",
    extractedAttributes: {
      category: "top",
      color: "cream",
      pattern: "solid",
      style: "formal",
      confidence: 0.93,
    },
    userTags: ["work", "date"],
    wearCount: 9,
    lastWornDate: "2026-02-01",
    purchaseDate: "2025-11-30",
    purchasePrice: 69.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.cos(i * 1.8) * 0.5),
    createdAt: "2025-11-30T12:00:00Z",
    updatedAt: "2026-02-01T19:15:00Z",
  },
  {
    id: "item-009",
    userId: "user-123",
    imageUrl: "/images/wardrobe/khaki-chinos.jpg",
    imageKey: "user-123/chinos.jpg",
    extractedAttributes: {
      category: "bottom",
      color: "beige",
      pattern: "solid",
      style: "smart casual",
      confidence: 0.96,
    },
    userTags: ["work", "casual"],
    wearCount: 22,
    lastWornDate: "2026-02-09",
    purchaseDate: "2025-09-15",
    purchasePrice: 54.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.sin(i * 0.5) * 0.7),
    createdAt: "2025-09-15T15:30:00Z",
    updatedAt: "2026-02-09T07:50:00Z",
  },
  {
    id: "item-010",
    userId: "user-123",
    imageUrl: "/images/wardrobe/summer-hat.jpg",
    imageKey: "user-123/hat.jpg",
    extractedAttributes: {
      category: "accessory",
      color: "straw",
      pattern: "solid",
      style: "casual",
      confidence: 0.85,
    },
    userTags: ["summer", "vacation"],
    wearCount: 2,
    lastWornDate: "2025-08-20",
    purchaseDate: "2025-07-01",
    purchasePrice: 19.99,
    embedding: Array.from({ length: 512 }, (_, i) => Math.cos(i * 2.5) * 0.2),
    createdAt: "2025-07-01T09:20:00Z",
    updatedAt: "2025-08-20T14:10:00Z",
  },
];

/** @deprecated Use mockWardrobeItems for new code. Kept for backward compatibility. */
export const wardrobeItems = mockWardrobeItems;

/**
 * Helper function to get a wardrobe item by ID.
 */
export function getWardrobeItemById(id: string) {
  return mockWardrobeItems.find((item) => item.id === id);
}

/**
 * Simulate API calls for wardrobe operations.
 * Use when REACT_APP_USE_MOCK=true or for development without a live backend.
 */
export const mockWardrobeApi = {
  /**
   * GET /api/wardrobe
   * Fetch all wardrobe items for the current user.
   */
  fetchWardrobe: async () => {
    console.log("Mock fetchWardrobe called");
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { items: mockWardrobeItems };
  },

  /**
   * GET /api/wardrobe/:id
   * Fetch a single item.
   */
  fetchItem: async (id: string) => {
    console.log(`Mock fetchItem called with id: ${id}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const item = getWardrobeItemById(id);
    if (!item) throw new Error("Item not found");
    return item;
  },

  /**
   * POST /api/wardrobe
   * Add a new item (simulated).
   */
  addItem: async (_formData: FormData) => {
    console.log("Mock addItem called");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const newItem = {
      id: `item-${Date.now()}`,
      userId: "user-123",
      imageUrl: "/images/wardrobe/white-tee.jpg",
      imageKey: "user-123/new-item.jpg",
      extractedAttributes: {
        category: "top",
        color: "blue",
        pattern: "solid",
        style: "casual",
        confidence: 0.9,
      },
      userTags: [] as string[],
      wearCount: 0,
      lastWornDate: null as string | null,
      purchaseDate: null as string | null,
      purchasePrice: null as number | null,
      embedding: Array.from({ length: 512 }, () => Math.random() - 0.5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newItem;
  },

  /**
   * PATCH /api/wardrobe/:id
   * Update an item.
   */
  updateItem: async (id: string, updates: Record<string, unknown>) => {
    console.log(`Mock updateItem called for ${id} with:`, updates);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const item = getWardrobeItemById(id);
    if (!item) throw new Error("Item not found");
    return { ...item, ...updates, updatedAt: new Date().toISOString() };
  },

  /**
   * DELETE /api/wardrobe/:id
   */
  deleteItem: async (id: string) => {
    console.log(`Mock deleteItem called for ${id}`);
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { success: true, message: "Item deleted" };
  },

  /**
   * POST /api/wardrobe/:id/wear
   * Record that the item was worn.
   */
  recordWear: async (id: string) => {
    console.log(`Mock recordWear called for ${id}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const item = getWardrobeItemById(id);
    if (!item) throw new Error("Item not found");
    return {
      ...item,
      wearCount: item.wearCount + 1,
      lastWornDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
    };
  },
};
