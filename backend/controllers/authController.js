const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

const verifyPassword = (password, stored) => {
  const [algorithm, salt, expected] = String(stored || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
};

const safeEqual = (value, expected) => {
  if (!expected) return false;
  const actualHash = crypto.createHash('sha256').update(String(value)).digest();
  const expectedHash = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(actualHash, expectedHash);
};

// @desc    Staff Login
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password, role = 'admin' } = req.body;

    if (!['admin', 'receptionist'].includes(role) || !username || !password) {
      return res.status(400).json({ success: false, message: 'Username, password and a valid role are required.' });
    }

    if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: 'Staff login is not configured.' });
    let authenticated = false;
    try {
      const result = await pool.query('SELECT username, password_hash, role FROM staff_users WHERE username = $1 AND role = $2 AND is_active = TRUE LIMIT 1', [username, role]);
      authenticated = result.rows.length === 1 && verifyPassword(password, result.rows[0].password_hash);
    } catch {
      // The configured environment account below remains available during database setup.
    }
    if (!authenticated) {
      const prefix = role === 'admin' ? 'ADMIN' : 'RECEPTIONIST';
      authenticated = safeEqual(username, process.env[`${prefix}_USERNAME`]) && safeEqual(password, process.env[`${prefix}_PASSWORD`]);
    }

    if (authenticated) {
      const sessionSeconds = 8 * 60 * 60;
      const token = jwt.sign(
        { username, role },
        process.env.JWT_SECRET,
        { expiresIn: sessionSeconds }
      );

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token,
        user: { username, role },
        expiresAt: new Date(Date.now() + sessionSeconds * 1000).toISOString()
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { loginAdmin };
