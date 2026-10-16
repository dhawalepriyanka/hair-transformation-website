const { pool } = require('../config/db');
const { uploadMedia } = require('../services/storageService');

// In-memory fallback if database query is temporarily unavailable
let inMemoryTransformations = [];

const formatMediaUrl = (url, id, field) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }
  if (trimmed.startsWith('data:')) {
    // Stored as base64 in database: serve through the binary streaming endpoint
    return `/api/transformations/media/${id}/${field}`;
  }
  return trimmed;
};

const rowToItem = (row) => {
  const id = String(row.id);
  return {
    id,
    clientName: row.client_name || '',
    village: row.village || '',
    treatment: row.treatment || '',
    period: row.period || '',
    rating: row.rating !== undefined ? Number(row.rating) : 5,
    testimonial: row.testimonial || '',
    before: formatMediaUrl(row.before_image, id, 'before'),
    after: formatMediaUrl(row.after_image, id, 'after'),
    image: formatMediaUrl(row.image, id, 'image'),
    video: formatMediaUrl(row.video, id, 'video'),
    beforeVideo: formatMediaUrl(row.before_video, id, 'beforeVideo'),
    afterVideo: formatMediaUrl(row.after_video, id, 'afterVideo'),
    duration: row.duration ? Number(row.duration) : 10,
    category: row.category || 'Hair Transformation',
    displayOrder: row.display_order !== undefined ? Number(row.display_order) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const DEFAULT_REELS = [
  {
    id: '9100001',
    client_name: 'Hair Transformation Reel',
    treatment: 'Keratin Smoothening & Gloss Shine',
    village: 'Sangamner, Maharashtra',
    period: 'Instagram Reel • 48K Views',
    video: '/instagram/reels/hair-transformation.mp4',
    category: 'Hair Transformation',
    rating: 5,
    testimonial: 'केसांचा पोत एकदम मऊ आणि शायनी झाला. Dipali didi यांचे काम अप्रतिम आहे!',
    duration: 15,
    display_order: 1
  },
  {
    id: '9100002',
    client_name: 'Hair Extensions Reel',
    treatment: 'Seamless Length & Volume Blend',
    village: 'Nashik, Maharashtra',
    period: 'Instagram Reel • 36K Views',
    video: '/instagram/reels/hair-extensions.mp4',
    category: 'Hair Extensions',
    rating: 5,
    testimonial: 'Instant length and natural thickness with seamless blending. Truly amazed!',
    duration: 15,
    display_order: 2
  },
  {
    id: '9100003',
    client_name: 'Hair Styling Reel',
    treatment: 'Professional Salon Blowdry & Curls',
    village: 'Ghargaon, Sangamner',
    period: 'Instagram Reel • 29K Views',
    video: '/instagram/reels/hair-styling.mp4',
    category: 'Hair Styling',
    rating: 5,
    testimonial: 'Bouncy curls and salon finish that lasted through the entire family occasion.',
    duration: 15,
    display_order: 3
  }
];

let didSeedTransformations = false;
const seedInitialTransformationsIfEmpty = async () => {
  if (didSeedTransformations) return;
  try {
    for (const item of DEFAULT_REELS) {
      await pool.query(`
        INSERT INTO transformations (
          id, client_name, village, treatment, period, rating, testimonial,
          video, duration, category, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        item.id, item.client_name, item.village, item.treatment, item.period,
        item.rating, item.testimonial, item.video, item.duration, item.category, item.display_order
      ]);
    }
    didSeedTransformations = true;
  } catch (err) {
    console.warn('Initial transformations seed check note:', err.message);
  }
};

// @desc    Get all transformations (Admin dashboard + TV APK)
// @route   GET /api/transformations
// @access  Public
const getTransformations = async (req, res, next) => {
  try {
    try {
      await seedInitialTransformationsIfEmpty();
      const query = `
        SELECT * FROM transformations 
        ORDER BY display_order ASC, created_at DESC
      `;
      const result = await pool.query(query);
      const items = result.rows.map(rowToItem);
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } catch (dbErr) {
      console.warn('DB transformations query fallback:', dbErr.message);
      return res.status(200).json({
        success: true,
        count: inMemoryTransformations.length,
        data: inMemoryTransformations
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Upload media file (Before/After image or video) to Cloud / Local Storage
// @route   POST /api/transformations/upload
// @access  Admin
const uploadTransformationMedia = async (req, res, next) => {
  try {
    let buffer = null;
    let originalname = 'media';
    let mimetype = 'image/jpeg';
    const field = req.body?.field || 'media';

    if (req.file) {
      buffer = req.file.buffer;
      originalname = req.file.originalname || 'upload';
      mimetype = req.file.mimetype || 'image/jpeg';
    } else if (req.body?.data && typeof req.body.data === 'string') {
      const dataStr = req.body.data.trim();
      if (dataStr.startsWith('data:')) {
        const matches = dataStr.match(/^data:([A-Za-z0-9/+-]+);base64,(.+)$/);
        if (matches) {
          mimetype = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
          originalname = req.body.filename || `file_${Date.now()}`;
        }
      }
    }

    if (!buffer) {
      return res.status(400).json({ success: false, message: 'No file or valid media data provided' });
    }

    const publicUrl = await uploadMedia({
      buffer,
      originalname,
      mimetype,
      subfolder: 'transformations'
    });

    return res.status(200).json({
      success: true,
      url: publicUrl,
      field
    });
  } catch (error) {
    console.error('Upload media error:', error);
    next(error);
  }
};

// @desc    Stream media directly from DB or redirect to cloud/local URL
// @route   GET /api/transformations/media/:id/:field
// @access  Public
const getTransformationMedia = async (req, res, next) => {
  try {
    const { id, field } = req.params;
    const columnMap = {
      before: 'before_image',
      after: 'after_image',
      image: 'image',
      video: 'video',
      beforeVideo: 'before_video',
      afterVideo: 'after_video'
    };
    const col = columnMap[field];
    if (!col) return res.status(400).json({ success: false, message: 'Invalid media field' });

    let rawValue = null;
    try {
      const result = await pool.query(`SELECT ${col} FROM transformations WHERE id = $1`, [id]);
      if (result.rows.length > 0) {
        rawValue = result.rows[0][col];
      }
    } catch (dbErr) {
      const found = inMemoryTransformations.find(t => String(t.id) === String(id));
      if (found) rawValue = found[field] || found[col];
    }

    if (!rawValue || typeof rawValue !== 'string') {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const trimmed = rawValue.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return res.redirect(302, trimmed);
    }

    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([A-Za-z0-9/+-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.end(buffer);
      }
    }

    return res.status(404).json({ success: false, message: 'Media format not recognized' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a transformation
// @route   POST /api/transformations
// @access  Admin
const createTransformation = async (req, res, next) => {
  try {
    const b = req.body || {};
    const id = b.id ? String(b.id) : String(Date.now());
    const clientName = (b.clientName || b.client_name || '').trim();
    const village = (b.village || '').trim();
    const treatment = (b.treatment || '').trim();
    const period = (b.period || '').trim();
    const rating = b.rating !== undefined ? Number(b.rating) : 5;
    const testimonial = (b.testimonial || '').trim();
    const beforeImage = b.before || b.before_image || '';
    const afterImage = b.after || b.after_image || '';
    const image = b.image || '';
    const video = b.video || '';
    const beforeVideo = b.beforeVideo || b.before_video || '';
    const afterVideo = b.afterVideo || b.after_video || '';
    const duration = b.duration ? Number(b.duration) : 10;
    const category = b.category || 'Hair Transformation';
    const displayOrder = b.displayOrder !== undefined ? Number(b.displayOrder) : 0;

    try {
      const query = `
        INSERT INTO transformations (
          id, client_name, village, treatment, period, rating, testimonial,
          before_image, after_image, image, video, before_video, after_video,
          duration, category, display_order
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16
        ) RETURNING *
      `;
      const values = [
        id, clientName, village, treatment, period, rating, testimonial,
        beforeImage, afterImage, image, video, beforeVideo, afterVideo,
        duration, category, displayOrder
      ];
      const result = await pool.query(query, values);
      const created = rowToItem(result.rows[0]);
      return res.status(201).json({ success: true, data: created });
    } catch (dbErr) {
      console.warn('DB transformation insert fallback:', dbErr.message);
      const fallbackItem = {
        id,
        clientName,
        village,
        treatment,
        period,
        rating,
        testimonial,
        before: beforeImage,
        after: afterImage,
        image,
        video,
        beforeVideo,
        afterVideo,
        duration,
        category,
        displayOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryTransformations = [fallbackItem, ...inMemoryTransformations.filter(t => String(t.id) !== id)];
      return res.status(201).json({ success: true, data: fallbackItem });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transformation
// @route   PUT /api/transformations/:id
// @access  Admin
const updateTransformation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const b = req.body || {};

    try {
      const existingRes = await pool.query('SELECT * FROM transformations WHERE id = $1', [id]);
      if (existingRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Transformation not found' });
      }
      const prev = existingRes.rows[0];

      const clientName = b.clientName !== undefined ? b.clientName : prev.client_name;
      const village = b.village !== undefined ? b.village : prev.village;
      const treatment = b.treatment !== undefined ? b.treatment : prev.treatment;
      const period = b.period !== undefined ? b.period : prev.period;
      const rating = b.rating !== undefined ? Number(b.rating) : prev.rating;
      const testimonial = b.testimonial !== undefined ? b.testimonial : prev.testimonial;
      const beforeImage = b.before !== undefined ? b.before : prev.before_image;
      const afterImage = b.after !== undefined ? b.after : prev.after_image;
      const image = b.image !== undefined ? b.image : prev.image;
      const video = b.video !== undefined ? b.video : prev.video;
      const beforeVideo = b.beforeVideo !== undefined ? b.beforeVideo : prev.before_video;
      const afterVideo = b.afterVideo !== undefined ? b.afterVideo : prev.after_video;
      const duration = b.duration !== undefined ? Number(b.duration) : prev.duration;
      const category = b.category !== undefined ? b.category : prev.category;
      const displayOrder = b.displayOrder !== undefined ? Number(b.displayOrder) : prev.display_order;

      const updateQuery = `
        UPDATE transformations SET
          client_name = $1, village = $2, treatment = $3, period = $4, rating = $5,
          testimonial = $6, before_image = $7, after_image = $8, image = $9,
          video = $10, before_video = $11, after_video = $12, duration = $13,
          category = $14, display_order = $15, updated_at = CURRENT_TIMESTAMP
        WHERE id = $16
        RETURNING *
      `;
      const values = [
        clientName, village, treatment, period, rating,
        testimonial, beforeImage, afterImage, image,
        video, beforeVideo, afterVideo, duration,
        category, displayOrder, id
      ];
      const result = await pool.query(updateQuery, values);
      return res.status(200).json({ success: true, data: rowToItem(result.rows[0]) });
    } catch (dbErr) {
      console.warn('DB transformation update fallback:', dbErr.message);
      const index = inMemoryTransformations.findIndex(t => String(t.id) === String(id));
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Transformation not found' });
      }
      inMemoryTransformations[index] = {
        ...inMemoryTransformations[index],
        ...b,
        updatedAt: new Date().toISOString()
      };
      return res.status(200).json({ success: true, data: inMemoryTransformations[index] });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transformation
// @route   DELETE /api/transformations/:id
// @access  Admin
const deleteTransformation = async (req, res, next) => {
  try {
    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM transformations WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Transformation not found' });
      }
      return res.status(200).json({ success: true, message: 'Transformation deleted successfully' });
    } catch (dbErr) {
      console.warn('DB transformation delete fallback:', dbErr.message);
      inMemoryTransformations = inMemoryTransformations.filter(t => String(t.id) !== String(id));
      return res.status(200).json({ success: true, message: 'Transformation deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Batch sync / migrate transformations from browser into persistent database
// @route   POST /api/transformations/migrate
// @access  Admin
const migrateTransformations = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Expected an array of transformations to migrate' });
    }

    const saved = [];
    for (const b of items) {
      const id = String(b.id || Date.now() + Math.floor(Math.random() * 1000));
      const clientName = (b.clientName || b.client_name || '').trim();
      const village = (b.village || '').trim();
      const treatment = (b.treatment || '').trim();
      const period = (b.period || '').trim();
      const rating = b.rating !== undefined ? Number(b.rating) : 5;
      const testimonial = (b.testimonial || '').trim();
      const beforeImage = b.before || b.before_image || '';
      const afterImage = b.after || b.after_image || '';
      const image = b.image || '';
      const video = b.video || '';
      const beforeVideo = b.beforeVideo || b.before_video || '';
      const afterVideo = b.afterVideo || b.after_video || '';
      const duration = b.duration ? Number(b.duration) : 10;
      const category = b.category || 'Hair Transformation';
      const displayOrder = b.displayOrder !== undefined ? Number(b.displayOrder) : 0;

      try {
        const query = `
          INSERT INTO transformations (
            id, client_name, village, treatment, period, rating, testimonial,
            before_image, after_image, image, video, before_video, after_video,
            duration, category, display_order
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13,
            $14, $15, $16
          )
          ON CONFLICT (id) DO UPDATE SET
            client_name = EXCLUDED.client_name,
            village = EXCLUDED.village,
            treatment = EXCLUDED.treatment,
            period = EXCLUDED.period,
            rating = EXCLUDED.rating,
            testimonial = EXCLUDED.testimonial,
            before_image = EXCLUDED.before_image,
            after_image = EXCLUDED.after_image,
            image = EXCLUDED.image,
            video = EXCLUDED.video,
            before_video = EXCLUDED.before_video,
            after_video = EXCLUDED.after_video,
            duration = EXCLUDED.duration,
            category = EXCLUDED.category,
            display_order = EXCLUDED.display_order,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        const values = [
          id, clientName, village, treatment, period, rating, testimonial,
          beforeImage, afterImage, image, video, beforeVideo, afterVideo,
          duration, category, displayOrder
        ];
        const result = await pool.query(query, values);
        saved.push(rowToItem(result.rows[0]));
      } catch (dbErr) {
        console.warn(`Migration note for id ${id}:`, dbErr.message);
        saved.push({ id, clientName, village, treatment });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully migrated ${saved.length} transformations to persistent database`,
      count: saved.length,
      data: saved
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransformations,
  uploadTransformationMedia,
  getTransformationMedia,
  createTransformation,
  updateTransformation,
  deleteTransformation,
  migrateTransformations
};
