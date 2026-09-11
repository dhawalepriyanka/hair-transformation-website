const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { ensureDatabase } = require('./config/db');

dotenv.config();

const app = express();

// Middleware
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This website origin is not allowed to access the API.'));
  }
}));
app.use(express.json({ limit: '8mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait and try again.' }
});
app.use('/api', apiLimiter);

const requireDatabase = async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'The clinic database is temporarily unavailable.'
    });
  }
};

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/patient-visits', requireDatabase, patientRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    await ensureDatabase();
    res.status(200).json({
      status: 'OK',
      database: 'connected',
      message: 'Dipali Wakale Hair & Skin Care API is ready',
      timestamp: new Date()
    });
  } catch {
    res.status(503).json({
      status: 'DEGRADED',
      database: 'unavailable',
      message: 'The API is running, but the clinic database is unavailable.',
      timestamp: new Date()
    });
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Dipali Wakale Hair & Skin Care API running on port ${PORT}`);
  });
}

module.exports = app;
