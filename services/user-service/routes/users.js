const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { requireAuth, getUserById } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: {
          message: 'Email, password, and name are required'
        }
      });
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: {
          message: 'User with this email already exists'
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name]
    );

    res.status(201).json({
      data: {
        id: result.insertId,
        email,
        name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'Email and password are required'
        }
      });
    }

    const [users] = await pool.execute(
      'SELECT id, email, password_hash, name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password'
        }
      });
    }

    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password'
        }
      });
    }

    req.session.userId = user.id;
    req.session.email = user.email;

    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: {
          message: 'Failed to logout'
        }
      });
    }
    res.clearCookie('connect.sid');
    res.status(204).send();
  });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found'
        }
      });
    }
    res.json({
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.session.userId;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (email !== undefined) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          error: {
            message: 'Email is already taken'
          }
        });
      }

      updates.push('email = ?');
      values.push(email);
    }

    if (password !== undefined) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      const user = await getUserById(userId);
      return res.json({
        data: user
      });
    }

    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const user = await getUserById(userId);
    res.json({
      data: user
    });
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;

