/**
 * Wardrobe Seed Items Mock Data
 */

export interface SeedItem {
  id: string;
  name: string;
  imageUrl: string;
  colorHex: string;
  category: string;
  brand: string;
  metadata: Record<string, string>;
}

export const wardrobeSeedItems: SeedItem[] = [
  {
    id: "seed-1",
    name: "Ivory Knit Sweater",
    imageUrl: "/placeholders/item1.svg",
    colorHex: "#F6F2EE",
    category: "sweater",
    brand: "DemoLabel",
    metadata: { fabric: "wool", season: "fall" }
  },
  {
    id: "seed-2",
    name: "Slim Indigo Jeans",
    imageUrl: "/placeholders/item2.svg",
    colorHex: "#123456",
    category: "jeans",
    brand: "DemoDenim",
    metadata: { fit: "slim" }
  }
];
