const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(400).json({ error: 'Email already used' });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)', [username, email, hash]);
    const token = jwt.sign({ id: r.insertId }, process.env.JWT_SECRET);
    res.json({ token, userId: r.insertId, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid creds' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid creds' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token, userId: user.id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
