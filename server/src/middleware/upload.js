import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const uploadStorageMode = isCloudinaryConfigured ? 'cloudinary' : 'local';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const fileFilter = (_req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Only JPEG, PNG, WebP or AVIF images are allowed'));
};

// Cloudinary → keep files in memory and stream them up.
// Local     → write straight to ./uploads and serve statically.
const storage =
  uploadStorageMode === 'cloudinary'
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          const base = path
            .basename(file.originalname, ext)
            .replace(/[^a-z0-9]+/gi, '-')
            .toLowerCase()
            .slice(0, 40);
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${base}${ext}`);
        },
      });

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 6 * 1024 * 1024, files: 10 },
});

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 's2vestis/products',
        resource_type: 'image',
        transformation: [{ width: 1400, height: 1400, crop: 'limit' }],
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

/**
 * Turns a multer file into a public URL.
 * Cloudinary → uploads the in-memory buffer and returns secure_url.
 * Local      → file is already on disk; build `${baseUrl}/uploads/<filename>`.
 */
export async function persistFile(file, req) {
  if (uploadStorageMode === 'cloudinary') {
    const result = await uploadBufferToCloudinary(file.buffer);
    return result.secure_url;
  }
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${file.filename}`;
}
