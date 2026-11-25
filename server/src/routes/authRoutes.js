const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// UC-01 / Sequence Diagram 14.1: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // 1. Find user by username in SQLite DB
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // 2. Verify password hash using bcryptjs (FR9)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // 3. Issue signed JWT session token (expires in 12 hours)
    const payload = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    // 4. Return 200 OK (token, role, user info)
    res.json({ token, user: payload });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get currently logged-in user profile from token
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;