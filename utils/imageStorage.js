// ShikshaShare Image Storage Utility
// Handles persistent storage of resource photos to disk in uploads/resources

const fs = require('fs');
const path = require('path');

const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads');
const RESOURCE_UPLOAD_DIR = path.join(UPLOAD_BASE_DIR, 'resources');

/**
 * Ensure upload directories exist
 */
function ensureUploadDirs() {
  if (!fs.existsSync(UPLOAD_BASE_DIR)) {
    fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESOURCE_UPLOAD_DIR)) {
    fs.mkdirSync(RESOURCE_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Map MIME sub-types to safe file extensions
 */
function getExtensionFromMime(mimeType) {
  const map = {
    'jpeg': 'jpg',
    'jpg': 'jpg',
    'png': 'png',
    'webp': 'webp',
    'gif': 'gif',
    'avif': 'avif'
  };
  const normalized = (mimeType || '').toLowerCase().replace('image/', '');
  return map[normalized] || 'jpg';
}

/**
 * Save a single base64 data URL or keep an existing saved URL
 * @param {string} item - Data URL or existing relative URL
 * @param {number} idx - Index number
 * @param {string} prefix - Optional filename prefix
 * @returns {string|null} - The persistent URL or null if invalid
 */
function saveImageItem(item, idx = 0, prefix = 'res-photo') {
  if (!item || typeof item !== 'string') return null;

  const trimmed = item.trim();

  // If already saved in uploads or is a valid URL path
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Check for base64 data URL
  const dataUrlMatch = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s);
  if (dataUrlMatch) {
    ensureUploadDirs();
    const rawMime = dataUrlMatch[1];
    const base64Data = dataUrlMatch[2];
    const ext = getExtensionFromMime(rawMime);

    try {
      const buffer = Buffer.from(base64Data, 'base64');
      // Enforce max 10MB per image on disk to protect storage
      if (buffer.length > 10 * 1024 * 1024) {
        console.warn('[ImageStorage] Image exceeds 10MB limit, skipping.');
        return null;
      }

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `${prefix}-${Date.now()}-${randomSuffix}-${idx}.${ext}`;
      const fullPath = path.join(RESOURCE_UPLOAD_DIR, filename);

      fs.writeFileSync(fullPath, buffer);
      return `/uploads/resources/${filename}`;
    } catch (err) {
      console.error('[ImageStorage] Failed to write image to disk:', err);
      return null;
    }
  }

  // If it's an existing valid http/https URL (e.g. legacy/seed items)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return null;
}

/**
 * Process a list of images, writing any base64 data URLs to disk
 * @param {Array<string>|string} inputImages
 * @param {string} prefix
 * @returns {Array<string>} Array of persistent image URLs
 */
function processResourceImages(inputImages, prefix = 'res-photo') {
  let list = [];
  if (Array.isArray(inputImages)) {
    list = inputImages;
  } else if (typeof inputImages === 'string' && inputImages.trim()) {
    list = [inputImages.trim()];
  }

  const savedUrls = [];
  list.forEach((item, index) => {
    const url = saveImageItem(item, index, prefix);
    if (url && !savedUrls.includes(url)) {
      savedUrls.push(url);
    }
  });

  return savedUrls;
}

/**
 * Validate that mandatory photos exist and can be stored
 * @param {Array<string>|string} images
 * @param {string} singleImage
 * @returns {{ valid: boolean, photos: string[], error?: string }}
 */
function validateAndSavePhotos(images, singleImage) {
  let candidates = [];
  if (Array.isArray(images) && images.length > 0) {
    candidates = images;
  } else if (singleImage && typeof singleImage === 'string') {
    candidates = [singleImage];
  }

  if (candidates.length === 0) {
    return {
      valid: false,
      photos: [],
      error: 'At least one actual resource photo is required before submitting your listing.'
    };
  }

  const saved = processResourceImages(candidates);
  if (saved.length === 0) {
    return {
      valid: false,
      photos: [],
      error: 'Invalid photo data provided. Please upload valid image files (JPG, PNG, WEBP).'
    };
  }

  return {
    valid: true,
    photos: saved
  };
}

module.exports = {
  ensureUploadDirs,
  saveImageItem,
  processResourceImages,
  validateAndSavePhotos,
  RESOURCE_UPLOAD_DIR
};
