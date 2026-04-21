import multer from 'multer';

const allowedExtensions = ['.pdf', '.txt', '.md'];
const maxUploadMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 50);

function isAllowedFile(fileName = '') {
  const lowered = fileName.toLowerCase();
  return allowedExtensions.some((ext) => lowered.endsWith(ext));
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadMb * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (isAllowedFile(file.originalname)) {
      cb(null, true);
      return;
    }
    const error = new Error('Only PDF, TXT, and MD files are allowed.');
    error.status = 400;
    cb(error);
  }
});
