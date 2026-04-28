import express from 'express';
import { upload } from '../middleware/uploadMiddleware';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/single', requireAuth, upload.single('file'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
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
