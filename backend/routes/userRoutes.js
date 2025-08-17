const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const checkBoardPermission = require('../middleware/checkBoardPermission');

router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) return res.json([]);

    const likeQuery = `%${query.trim()}%`;
    const [users] = await pool.query(
      'SELECT id, username, email FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 10',
      [likeQuery, likeQuery]
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'User search failed' });
  }
});

router.post('/batch', auth, async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids) || ids.length === 0) return res.json([]);
  const placeholders = ids.map(() => '?').join(',');
  const validIds = ids.filter(id => id !== null); // Filter out nulls
   if (validIds.length === 0) return res.json([]);
  const [users] = await pool.query(
    `SELECT id, username FROM users WHERE id IN (${placeholders})`,
    validIds
  );
  res.json(users);
});


module.exports = router;
