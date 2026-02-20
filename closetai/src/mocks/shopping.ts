// mocks/shopping.ts
export const shoppingAnalysis = {
  score: 85,
  attributes: {
    category: "top",
    color: "blue",
    pattern: "striped",
    style: "casual",
  },
  recommendations: [
    { id: "outfit-001", description: "Pair with your black jeans and sneakers", garmentIds: ["item-001", "item-002", "item-005"] },
    { id: "outfit-002", description: "Layer under your leather jacket", garmentIds: ["item-003", "item-001", "item-002"] },
    { id: "outfit-004", description: "Add the wool scarf for a preppy look", garmentIds: ["item-006", "item-001", "item-007"] },
  ],
};
