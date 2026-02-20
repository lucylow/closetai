const multer = require('multer');

const storage = multer.memoryStorage();
const limits = { fileSize: 10 * 1024 * 1024 };

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage, limits, fileFilter });

module.exports = upload;
