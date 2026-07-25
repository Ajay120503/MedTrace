const cloudinary = require('cloudinary').v2;
const logger = require('../config/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_TYPES = ['jpg', 'jpeg', 'png', 'pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const FOLDER_MAP = {
  'doctors/certificates': 'doctors/certificates',
  'hospitals/logos': 'hospitals/logos',
  'patients/photos': 'patients/photos'
};

/**
 * Generate signed upload parameters for client-side upload
 * @param {string} folder - one of FOLDER_MAP keys
 * @param {string} publicId - optional custom public ID
 * @returns {object} { signature, timestamp, publicId, folder, apiKey, cloudName }
 */
function generateSignature(folder, publicId = null) {
  if (!FOLDER_MAP[folder]) {
    throw new Error(`Invalid upload folder: ${folder}. Must be one of: ${Object.keys(FOLDER_MAP).join(', ')}`);
  }

  const timestamp = Math.round(Date.now() / 1000);
  const uploadParams = {
    timestamp,
    folder: FOLDER_MAP[folder],
    allowed_formats: ALLOWED_TYPES,
    max_bytes: MAX_FILE_SIZE,
    ...(publicId ? { public_id: publicId } : {})
  };

  const signature = cloudinary.utils.api_sign_request(uploadParams, process.env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    publicId: publicId || undefined,
    folder: FOLDER_MAP[folder],
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    allowedFormats: ALLOWED_TYPES,
    maxFileSize: MAX_FILE_SIZE
  };
}

/**
 * Delete an image from Cloudinary by publicId
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info({ publicId, result: result.result }, 'Cloudinary delete');
    return result.result === 'ok';
  } catch (error) {
    logger.error({ error: error.message, publicId }, 'Cloudinary delete failed');
    throw error;
  }
}

module.exports = { generateSignature, deleteImage, ALLOWED_TYPES, MAX_FILE_SIZE, FOLDER_MAP };