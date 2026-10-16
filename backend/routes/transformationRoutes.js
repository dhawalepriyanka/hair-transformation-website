const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer memory storage for cloud/database streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

const {
  getTransformations,
  uploadTransformationMedia,
  getTransformationMedia,
  createTransformation,
  updateTransformation,
  deleteTransformation,
  migrateTransformations
} = require('../controllers/transformationController');

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
