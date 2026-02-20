// lightweight feature store: Postgres-backed getters/setters for user/item features
import db from '../db';
import logger from '../lib/logger';

export async function upsertUser(user:any) {
  const res = await db.query('INSERT INTO users (anon_id, preferences) VALUES ($1,$2) ON CONFLICT (anon_id) DO UPDATE SET preferences = $2 RETURNING id', [user.anon_id, user.preferences || {}]);
  return res.rows[0].id;
}

export async function upsertItem(item:any) {
  const res = await db.query('INSERT INTO items (item_id, owner_user_id, title, metadata) VALUES ($1,$2,$3,$4) ON CONFLICT (item_id) DO UPDATE SET metadata=$4 RETURNING id', [item.item_id, item.owner_user_id, item.title, item.metadata || {}]);
  return res.rows[0].id;
}

export async function storeItemEmbedding(itemId:string, vector:number[]) {
  await db.query('INSERT INTO item_embeddings (item_id, vector) VALUES ($1,$2)', [itemId, vector]);
}

export async function getItemEmbeddings(limit = 1000) {
  const res = await db.query('SELECT item_id, vector FROM item_embeddings LIMIT $1', [limit]);
  return res.rows;
}
