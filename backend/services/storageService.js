const fs = require('fs');
const path = require('path');

// Configure Cloudinary lazily if credentials exist
let cloudinary = null;
try {
  if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
    cloudinary = require('cloudinary').v2;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }
    console.log('[Storage] Cloudinary initialized for persistent media uploads.');
  }
} catch (e) {
  console.warn('[Storage] Cloudinary module load note:', e.message);
}

const getUploadDir = (subfolder = 'transformations') => {
  const dir = path.join(__dirname, '..', 'uploads', subfolder);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch (err) {
    return null;
  }
};

/**
 * Uploads media buffer to Cloud Storage (Cloudinary) or local uploads directory
 * @param {Object} options
 * @param {Buffer} options.buffer - Raw binary file buffer
 * @param {string} options.originalname - Original filename
 * @param {string} options.mimetype - e.g. 'image/jpeg', 'image/webp', 'video/mp4'
 * @param {string} options.subfolder - 'transformations'
 * @returns {Promise<string>} Public URL of the uploaded asset
 */
const uploadMedia = async ({ buffer, originalname = 'media', mimetype = 'image/jpeg', subfolder = 'transformations' }) => {
  // 1. Try Cloudinary if configured
  if (cloudinary) {
    try {
      const isVideo = mimetype.startsWith('video/');
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `dipali_wakale/${subfolder}`,
            resource_type: isVideo ? 'video' : 'image',
            transformation: isVideo ? undefined : [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
      console.log(`[Storage] Uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (cloudErr) {
      console.warn('[Storage] Cloudinary upload failed, trying local storage fallback:', cloudErr.message);
    }
  }

  // 2. Try Local uploads folder (persistent on servers / local development)
  const uploadDir = getUploadDir(subfolder);
  if (uploadDir) {
    try {
      const ext = path.extname(originalname) || (mimetype.startsWith('video/') ? '.mp4' : mimetype.includes('png') ? '.png' : '.jpg');
      const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, buffer);
      console.log(`[Storage] Saved locally: /uploads/${subfolder}/${safeName}`);
      return `/uploads/${subfolder}/${safeName}`;
    } catch (fsErr) {
      console.warn('[Storage] Local disk write failed (ephemeral filesystem):', fsErr.message);
    }
  }

  // 3. Fallback: Base64 data URI (stored in PostgreSQL TEXT column, served via /api/transformations/media/:id/:field)
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

module.exports = {
  uploadMedia,
  getUploadDir
};
