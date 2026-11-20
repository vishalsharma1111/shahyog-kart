const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️ Cloudinary image storage configured and active.');
} else {
  console.log('📁 Cloudinary credentials not detected; using secure local disk storage fallback.');
}

/**
 * Uploads a local file (from multer diskStorage) to Cloudinary or returns local path
 * @param {string} localFilePath - Path to the file saved on disk by multer
 * @param {string} folder - Folder name in Cloudinary (e.g. 'products', 'donations', 'proofs')
 * @returns {Promise<string>} Public URL of the uploaded image
 */
async function uploadImage(localFilePath, folder = 'shahyog_kart') {
  if (!localFilePath) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: `shahyog_kart/${folder}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto'
      });

      // Remove local temp file after cloud upload
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload warning:', err.message);
      // Fallback to local path if cloud upload fails
      return `/uploads/${localFilePath.replace(/\\/g, '/').split('uploads/').pop()}`;
    }
  } else {
    // Return relative static path
    const fileName = localFilePath.replace(/\\/g, '/').split('uploads/').pop();
    return `/uploads/${fileName}`;
  }
}

module.exports = {
  isCloudinaryConfigured,
  uploadImage
};
