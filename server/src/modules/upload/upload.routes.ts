import { AppError } from '../../utils/appError';
import express from 'express';
import { upload } from '../../middlewares/upload.middleware';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = express.Router();

router.post('/single', requireAuth, upload.single('file'), (req: any, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  
  const fileUrl = `/api/uploads/${req.file.filename}`;
  res.json({ 
    message: 'File uploaded successfully',
    file: {
      name: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

export default router;
