/**
 * Users API: sign up for demo / judge walkthrough.
 * POST /api/users - create user with id, email, full_name (idempotent)
 */
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'demo-placeholder';

/**
 * POST /api/users
 * body: { id, email, full_name }
 * Creates user for billing demo. Idempotent (upsert by id).
 */
router.post('/', async (req, res) => {
  try {
    const { id, email, full_name } = req.body;
    if (!id || !email) {
      return res.status(400).json({ error: 'id and email required' });
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    await db.query(
      `INSERT INTO users (id, email, password, full_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email, full_name = COALESCE(EXCLUDED.full_name, users.full_name), updated_at = now()`,
      [id, email, hashedPassword, full_name || null]
    );

    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.json({ ok: true });
    }
    console.error('users create error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/users/guest
 * Create an anonymous guest user with default credits.
 * Returns: { user: { id, anonId, creditsBalance } }
 */
router.post('/guest', async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    const anonId = `guest_${id.slice(0, 8)}`;

    const result = await db.query(
      `INSERT INTO users (id, anon_id, credits_balance)
       VALUES ($1, $2, 25)
       RETURNING id, anon_id, credits_balance, created_at`,
      [id, anonId]
    );

    const row = result.rows[0];
    res.status(201).json({
      user: {
        id: row.id,
        anonId: row.anon_id,
        creditsBalance: row.credits_balance,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error('guest user create error', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/users/:id
 * Retrieve user by id.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, anon_id, email, display_name, is_brand,
              credits_balance, credits_used, plan, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('user fetch error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
