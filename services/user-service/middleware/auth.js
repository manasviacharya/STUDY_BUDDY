const pool = require('../db');

const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: {
        message: 'Authentication required'
      }
    });
  }
  next();
};

const getUserById = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT id, email, name FROM users WHERE id = ?',
    [userId]
  );
  return rows[0] || null;
};

module.exports = { requireAuth, getUserById };

