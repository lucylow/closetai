// eslint-disable-next-line @typescript-eslint/no-var-requires
const { query } = require('../db') as { query: <T = any>(text: string, params?: any[]) => Promise<{ rows: T[] }> };
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  anon_id: string;
  email: string | null;
  display_name: string | null;
  is_brand: boolean;
  credits_balance: number;
  credits_used: number;
  plan: string;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, anon_id, email, display_name, is_brand,
            credits_balance, credits_used, plan,
            created_at, updated_at, last_login
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getUserByAnonId(anonId: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, anon_id, email, display_name, is_brand,
            credits_balance, credits_used, plan,
            created_at, updated_at, last_login
     FROM users WHERE anon_id = $1`,
    [anonId]
  );
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, anon_id, email, display_name, is_brand,
            credits_balance, credits_used, plan,
            created_at, updated_at, last_login
     FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function createAnonUser(): Promise<User> {
  const id = uuidv4();
  const anonId = `guest_${id.slice(0, 8)}`;

  const { rows } = await query<User>(
    `INSERT INTO users (id, anon_id, credits_balance)
     VALUES ($1, $2, 25)
     RETURNING id, anon_id, email, display_name, is_brand,
               credits_balance, credits_used, plan,
               created_at, updated_at, last_login`,
    [id, anonId]
  );
  return rows[0];
}

export async function updateCredits(
  userId: string,
  amount: number
): Promise<User | null> {
  const { rows } = await query<User>(
    `UPDATE users
     SET credits_balance = credits_balance + $2,
         updated_at = now()
     WHERE id = $1
     RETURNING id, anon_id, email, display_name, is_brand,
               credits_balance, credits_used, plan,
               created_at, updated_at, last_login`,
    [userId, amount]
  );
  return rows[0] ?? null;
}

export async function updateLastLogin(userId: string): Promise<void> {
  await query(
    `UPDATE users SET last_login = now(), updated_at = now() WHERE id = $1`,
    [userId]
  );
}
