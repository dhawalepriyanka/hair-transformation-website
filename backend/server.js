const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const transformationRoutes = require('./routes/transformationRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { ensureDatabase } = require('./config/db');
const { createCorsOptions } = require('./config/cors');

dotenv.config();

const app = express();

// Middleware
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait and try again.' }
});
app.use('/api', apiLimiter);

const requireDatabase = async (req, res, next) => {
  try {
    await ensureDatabase();
  } catch (error) {
    console.warn('[Database] Connection note:', error.message);
  }
  next();
};

// API Routes
app.use('/api/products', requireDatabase, productRoutes);
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/patient-visits', requireDatabase, patientRoutes);
app.use('/api/transformations', requireDatabase, transformationRoutes);
app.use('/api/upload', requireDatabase, transformationRoutes);

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
    res.status(200).json({
      status: 'DEGRADED',
      database: 'unavailable',
      message: 'The API is running with in-memory storage fallback.',
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
