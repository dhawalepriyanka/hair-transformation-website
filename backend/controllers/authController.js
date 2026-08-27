const jwt = require('jsonwebtoken');

// @desc    Admin Login
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const envUsername = process.env.ADMIN_USERNAME;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (username === envUsername && password === envPassword) {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET || 'jewellery_catalogue_secret_key_2026',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Admin authentication successful',
        token,
        user: { username, role: 'admin' }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin username or password'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { loginAdmin };
