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
    return {
      folder: 'posts',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo ? ['mp4', 'mov', 'avi', 'webm'] : ['jpg', 'jpeg', 'png', 'gif'],
      transformation: isVideo ? [{ width: 720, crop: 'limit' }] : [{ width: 800, crop: 'limit' }]
    };
  },
});

const upload = multer({ storage });
module.exports = upload;