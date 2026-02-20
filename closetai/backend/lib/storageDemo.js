// backend/lib/storageDemo.js
/**
 * Minimal demo storage abstraction.
 * - Saves buffers to local UPLOAD_DIR.
 * - Returns object { id, fileName, url, path }.
 *
 * For production, use S3 storage (storage.js).
 * This demo storage is used when INTEGRATION_MODE=demo.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save Buffer (or Uint8Array) as file to UPLOAD_DIR.
 * @param {Buffer|Uint8Array} buffer
 * @param {string} originalName
 */
async function saveBufferAsFile(buffer, originalName = 'upload.jpg') {
  const id = uuidv4();
  const ext = path.extname(originalName) || '.jpg';
  const fileName = `${id}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  await fs.promises.writeFile(filePath, buffer);
  
  return {
    id,
    fileName,
    url: `/uploads/${fileName}`,
    path: filePath,
  };
}

/**
 * Get file path for a given fileName
 */
function getFilePath(fileName) {
  return path.join(UPLOAD_DIR, fileName);
}

/**
 * Check if file exists
 */
async function fileExists(fileName) {
  const filePath = path.join(UPLOAD_DIR, fileName);
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file as buffer
 */
async function readFileAsBuffer(fileName) {
  const filePath = path.join(UPLOAD_DIR, fileName);
  return fs.promises.readFile(filePath);
}

module.exports = {
  saveBufferAsFile,
  getFilePath,
  fileExists,
  readFileAsBuffer,
  UPLOAD_DIR,
};
