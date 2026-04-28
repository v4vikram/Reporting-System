import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import {
  createReport,
  getReports,
  getReportById,
  getReportStats,
  getLatestCoverage,
  updateReport,
  deleteReport,
  duplicateReport,
  createSection,
  updateSection,
  deleteSection,
  duplicateSection,
  createTable,
  updateTable,
  deleteTable,
  addRow,
  updateRow,
  deleteRow,
  uploadScreenshots,
  uploadRowImage,
  generatePDF
} from '../controllers/reportController';
import multer from 'multer';

const router = express.Router();

// Multer setup for screenshots
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Stats route
router.route('/stats')
  .get(requireAuth, getReportStats);

router.route('/latest-coverage')
  .get(requireAuth, getLatestCoverage);

// Report routes
router.route('/')
  .post(requireAuth, requireRole(['super_admin', 'employee']), createReport)
  .get(requireAuth, getReports);

router.route('/:id')
  .get(requireAuth, getReportById)
  .put(requireAuth, requireRole(['super_admin', 'employee']), updateReport)
  .delete(requireAuth, requireRole(['super_admin', 'employee']), deleteReport);

router.route('/:id/duplicate')
  .post(requireAuth, requireRole(['super_admin', 'employee']), duplicateReport);

// Section routes
router.route('/:reportId/sections')
  .post(requireAuth, requireRole(['super_admin', 'employee']), createSection);

router.route('/:reportId/sections/:sectionId/duplicate')
  .post(requireAuth, requireRole(['super_admin', 'employee']), duplicateSection);

router.route('/sections/:sectionId')
  .put(requireAuth, requireRole(['super_admin', 'employee']), updateSection)
  .delete(requireAuth, requireRole(['super_admin', 'employee']), deleteSection);

// Table routes
router.route('/sections/:sectionId/tables')
  .post(requireAuth, requireRole(['super_admin', 'employee']), createTable);

router.route('/tables/:tableId')
  .put(requireAuth, requireRole(['super_admin', 'employee']), updateTable)
  .delete(requireAuth, requireRole(['super_admin', 'employee']), deleteTable);

// Row routes
router.route('/tables/:tableId/rows')
  .post(requireAuth, requireRole(['super_admin', 'employee']), addRow);

router.route('/tables/:tableId/rows/:rowId')
  .put(requireAuth, requireRole(['super_admin', 'employee']), updateRow)
  .delete(requireAuth, requireRole(['super_admin', 'employee']), deleteRow);

// Screenshot routes
router.route('/tables/:tableId/screenshots')
  .post(requireAuth, requireRole(['super_admin', 'employee']), upload.array('images', 30), uploadScreenshots);

router.route('/tables/:tableId/rows/:rowId/image')
  .post(requireAuth, requireRole(['super_admin', 'employee']), upload.single('image'), uploadRowImage);

// PDF route
router.route('/:id/pdf')
  .get(requireAuth, generatePDF);

export default router;
