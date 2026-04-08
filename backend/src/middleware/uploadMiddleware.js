// backend/src/middleware/uploadMiddleware.js (modifié)
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');
    let folder = 'chat_files';
    let resourceType = 'auto';
    let allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'pdf', 'doc', 'docx', 'txt'];
    if (isImage) resourceType = 'image';
    else if (isVideo) resourceType = 'video';
    else resourceType = 'raw';
    return {
      folder,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
    };
  },
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB max
module.exports = upload;