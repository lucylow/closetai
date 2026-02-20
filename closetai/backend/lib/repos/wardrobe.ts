// eslint-disable-next-line @typescript-eslint/no-var-requires
const { query } = require('../db') as { query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[] }> };

export interface WardrobeItem {
  id: string;
  user_id: string;
  category: string;
  name: string;
  brand: string | null;
  image_key: string | null;
  ai_tags: string[] | null;
  color_tags: string[] | null;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export async function createWardrobeItem(params: {
  userId: string;
  category: string;
  name: string;
  imageKey: string;
  brand?: string;
  aiTags?: string[];
  colorTags?: string[];
}): Promise<WardrobeItem> {
  const { rows } = await query<WardrobeItem>(
    `INSERT INTO wardrobe_items (user_id, category, name, image_key, brand, ai_tags, color_tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      params.userId,
      params.category,
      params.name,
      params.imageKey,
      params.brand ?? null,
      params.aiTags ?? null,
      params.colorTags ?? null,
    ]
  );
  return rows[0];
}

export async function listWardrobeItems(
  userId: string,
  category?: string,
  limit = 50,
  offset = 0
): Promise<{ items: WardrobeItem[]; total: number }> {
  const conditions = ['user_id = $1'];
  const params: any[] = [userId];

  if (category) {
    conditions.push(`category = $${params.length + 1}`);
    params.push(category);
  }

  const where = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM wardrobe_items WHERE ${where}`,
    params
  );

  params.push(limit, offset);
  const { rows } = await query<WardrobeItem>(
    `SELECT * FROM wardrobe_items
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    items: rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getWardrobeItem(id: string): Promise<WardrobeItem | null> {
  const { rows } = await query<WardrobeItem>(
    `SELECT * FROM wardrobe_items WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function deleteWardrobeItem(id: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM wardrobe_items WHERE id = $1`,
    [id]
  );
  return (result as any).rowCount > 0;
}

export async function incrementUsageCount(id: string): Promise<WardrobeItem | null> {
  const { rows } = await query<WardrobeItem>(
    `UPDATE wardrobe_items
     SET usage_count = usage_count + 1, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}
