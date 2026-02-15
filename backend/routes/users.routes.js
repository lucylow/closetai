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

module.exports = router;
