const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer memory storage for cloud/database streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max
  }
});

const {
  getTransformations,
  checkTransformationsVersion,
  uploadTransformationMedia,
  getTransformationMedia,
  createTransformation,
  updateTransformation,
  deleteTransformation,
  migrateTransformations,
  streamInstagramVideo,
  reorderTransformations
} = require('../controllers/transformationController');

// Ultra-lightweight version check endpoint for TV and background polling
router.get('/check', checkTransformationsVersion);

// Batch reorder transformations sequence
router.post('/reorder', reorderTransformations);

// Native Instagram video streaming endpoint with audio for automated TV playback
router.get('/instagram-video', streamInstagramVideo);

// Upload media endpoint (accepts 'file', 'media', or any multipart field, or JSON)
router.post('/upload', upload.any(), uploadTransformationMedia);

// Direct binary streaming endpoint for database-stored media
router.get('/media/:id/:field', getTransformationMedia);

// Migration endpoint from browser localStorage to database
router.post('/migrate', migrateTransformations);

// CRUD endpoints
router.route('/')
  .get(getTransformations)
  .post(createTransformation);

router.route('/:id')
  .put(updateTransformation)
  .delete(deleteTransformation);

module.exports = router;
