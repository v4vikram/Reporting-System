import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/responseHandler';
import { AppError } from '../../utils/appError';
import { Request, Response } from 'express';
import Report from './models/report.model';
import Section from './models/section.model';
import CoverageTable from './models/coverageTable.model';
import * as reportService from './report.service';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { config } from '../../config/env';

const getAbsoluteUrl = (url: string, isInternal = false) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  // For Puppeteer internal requests, we prefer localhost to avoid networking loop issues with external URLs
  const baseUrl = isInternal 
  ? `http://127.0.0.1:${config.port}`
  : (process.env.APP_URL || config.clientUrl || `http://localhost:${config.port}`);
  
  // Ensure we don't have double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBaseUrl}${cleanUrl}`;
};

// Reports
export const createReport = asyncHandler(async (req: Request, res: Response) => {
    const { clientId, title, month, date, time, category, assignedTo } = req.body;
  const report = new Report({
    clientId,
    title,
    month,
    date,
    time,
    category,
    assignedTo: assignedTo === '' ? undefined : assignedTo,
    createdBy: (req as any).user?.id
  });
  await report.save();
  sendResponse(res, 201, report, 'Report created successfully');
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const userId = (req as any).user?.id;
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  // Clients can see all reports assigned to them to track draft progress
  const query = userRole === 'client' ? { clientId: userId } : {};
  
  const reports = await Report.find(query)
    .populate('clientId', 'name email role')
    .populate('assignedTo', 'name email role')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Report.countDocuments(query);

  const reportsWithCategories = await Promise.all(reports.map(async (report) => {
    const tables = await CoverageTable.find({ reportId: report._id }).select('category').lean();
    const categories = new Set<string>();
    tables.forEach(t => {
      if (t.category) categories.add(t.category);
    });
    return { ...report, aggregatedCategories: Array.from(categories) };
  }));

  sendResponse(res, 200, {
    reports: reportsWithCategories,
    total,
    page,
    pages: Math.ceil(total / limit)
  }, 'Reports fetched successfully');
});

export const getReportStats = asyncHandler(async (req: Request, res: Response) => {
    const userRole = (req as any).user?.role;
  const userId = (req as any).user?.id;
  
  const stats = await reportService.getReportStats(userRole, userId);
  sendResponse(res, 200, stats, 'Stats fetched successfully');
});

export const getLatestCoverage = asyncHandler(async (req: Request, res: Response) => {
    const userRole = (req as any).user?.role;
  const userId = (req as any).user?.id;
  const topOnly = req.query.topOnly === 'true';
  
  const latestCoverage = await reportService.getLatestCoverage(userRole, userId, topOnly);
  sendResponse(res, 200, latestCoverage, 'Latest coverage fetched successfully');
});

export const getReportById = asyncHandler(async (req: Request, res: Response) => {
    const report = await Report.findById(req.params.id)
    .populate('clientId', 'name email role')
    .populate('assignedTo', 'name email role');
  if (!report) throw new AppError('Report not found', 404);
  
  if ((req as any).user?.role === 'client' && (report.clientId._id.toString() !== (req as any).user.id.toString() || report.status !== 'published')) {
    throw new AppError('Not authorized', 403);
  }

  const sections = await Section.find({ reportId: report._id }).sort('order');
  const sectionsWithTables = await Promise.all(sections.map(async (section) => {
    const tables = await CoverageTable.find({ sectionId: section._id }).sort('order');
    return { ...section.toObject(), tables };
  }));

  res.json({ ...report.toObject(), sections: sectionsWithTables });
});

export const updateReport = asyncHandler(async (req: Request, res: Response) => {
    const { title, month, date, time, category, status, assignedTo, clientId, coverPages } = req.body;
  
  // Convert empty string to null for optional ObjectId field
  const updateData: any = { 
    title, 
    month, 
    date,
    time,
    category,
    status, 
    clientId 
  };
  
  if (coverPages) {
    updateData.coverPages = coverPages;
  }

  if (assignedTo === '') {
    updateData.assignedTo = null;
  } else if (assignedTo) {
    updateData.assignedTo = assignedTo;
  }

  const report = await Report.findByIdAndUpdate(
    req.params.id, 
    updateData, 
    { new: true }
  ).populate('clientId', 'name email role').populate('assignedTo', 'name email role');
  res.json(report);
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
    await Report.findByIdAndDelete(req.params.id);
  await Section.deleteMany({ reportId: req.params.id });
  await CoverageTable.deleteMany({ reportId: req.params.id });
  res.json({ message: 'Report removed' });
});

export const duplicateReport = asyncHandler(async (req: Request, res: Response) => {
    const newReport = await reportService.duplicateReport(req.params.id, (req as any).user?.id);
  res.status(201).json(newReport);
});


// Sections
export const createSection = asyncHandler(async (req: Request, res: Response) => {
    const section = new Section({ ...req.body, reportId: req.params.reportId });
  await section.save();
  res.status(201).json(section);
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
    const section = await Section.findByIdAndUpdate(req.params.sectionId, req.body, { new: true });
  res.json(section);
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
    await Section.findByIdAndDelete(req.params.sectionId);
  await CoverageTable.deleteMany({ sectionId: req.params.sectionId });
  res.json({ message: 'Section removed' });
});

// Tables
export const createTable = asyncHandler(async (req: Request, res: Response) => {
    const section = await Section.findById(req.params.sectionId);
  if (!section) throw new AppError('Section not found', 404);

  const table = new CoverageTable({ ...req.body, sectionId: section._id, reportId: section.reportId });
  await table.save();
  res.status(201).json(table);
});

export const updateTable = asyncHandler(async (req: Request, res: Response) => {
    const table = await CoverageTable.findByIdAndUpdate(req.params.tableId, req.body, { new: true });
  res.json(table);
});

export const deleteTable = asyncHandler(async (req: Request, res: Response) => {
    await CoverageTable.findByIdAndDelete(req.params.tableId);
  res.json({ message: 'Table removed' });
});

// Rows
export const addRow = asyncHandler(async (req: Request, res: Response) => {
    const table = await CoverageTable.findById(req.params.tableId);
  if (!table) throw new AppError('Table not found', 404);

  table.rows.push(req.body);
  await table.save();
  res.status(201).json(table);
});

// Sections
export const duplicateSection = asyncHandler(async (req: Request, res: Response) => {
    const sectionsWithTables = await reportService.duplicateSection(req.params.sectionId);
  res.status(201).json(sectionsWithTables);
});



export const updateRow = asyncHandler(async (req: Request, res: Response) => {
    const table = await CoverageTable.findById(req.params.tableId);
  if (!table) throw new AppError('Table not found', 404);

  const row = (table.rows as any).id(req.params.rowId);
  if (!row) throw new AppError('Row not found', 404);

  Object.assign(row, req.body);
  await table.save();
  res.json(table);
});

export const deleteRow = asyncHandler(async (req: Request, res: Response) => {
    const table = await CoverageTable.findById(req.params.tableId);
  if (!table) throw new AppError('Table not found', 404);

  (table.rows as any).pull({ _id: req.params.rowId });
  await table.save();
  res.json(table);
});

// Screenshots
export const uploadScreenshots = asyncHandler(async (req: Request, res: Response) => {
    const table = await CoverageTable.findById(req.params.tableId);
  if (!table) throw new AppError('Table not found', 404);

  if (!req.files || !Array.isArray(req.files)) {
    throw new AppError('No files uploaded', 400);
  }

  const uploadDir = path.join(__dirname, '..', 'uploads', 'screenshots');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const newScreenshots = await Promise.all(req.files.map(async (file, index) => {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join(uploadDir, filename);

    await sharp(file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    return {
      url: `/api/uploads/screenshots/${filename}`,
      order: table.screenshots.length + index
    };
  }));

  table.screenshots.push(...newScreenshots);
  await table.save();
  
  res.json(table);
});

export const uploadRowImage = asyncHandler(async (req: Request, res: Response) => {
    const table = await CoverageTable.findById(req.params.tableId);
  if (!table) throw new AppError('Table not found', 404);

  const row = (table.rows as any).id(req.params.rowId);
  if (!row) throw new AppError('Row not found', 404);

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const uploadDir = path.join(__dirname, '..', 'uploads', 'rows');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `row-${req.params.rowId}-${Date.now()}.webp`;
  const filepath = path.join(uploadDir, filename);

  await sharp(req.file.buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath);

  const imageUrl = `/api/uploads/rows/${filename}`;
  (row as any).image = imageUrl;
  await table.save();

  res.json(table);
});

// PDF Generation
export const generatePDF = asyncHandler(async (req: Request, res: Response) => {
    const report = await Report.findById(req.params.id).populate('clientId', 'name');
  if (!report) throw new AppError('Report not found', 404);

  if ((req as any).user?.role === 'client' && (report.clientId._id.toString() !== (req as any).user.id.toString() || report.status !== 'published')) {
    throw new AppError('Not authorized', 403);
  }

  const sections = await Section.find({ reportId: report._id }).sort('order');
  const allSectionsWithTables = await Promise.all(sections.map(async (section) => {
    const tables = await CoverageTable.find({ sectionId: section._id }).sort('order');
    return { ...section.toObject(), tables };
  }));

  const sectionsWithTables = allSectionsWithTables.filter(s => 
    (s.type === 'custom' && s.image) || 
    (s.tables && s.tables.length > 0)
  );

  // Check for custom header image in uploads folder (check png, jpg, webp)
  const headerExtensions = ['png', 'jpg', 'jpeg', 'webp'];
  let headerImageUrl = 'https://via.placeholder.com/800x100.png?text=Header+Image+Placeholder';
  
  for (const ext of headerExtensions) {
    const p = path.join(__dirname, '..', 'uploads', `header.${ext}`);
    if (fs.existsSync(p)) {
                const imageData = fs.readFileSync(p);
        const base64 = imageData.toString('base64');
        const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
        headerImageUrl = `data:${mimeType};base64,${base64}`;
        break;
    }
  }

  // Check for custom footer image in uploads folder
  let footerImageUrl = '';
  for (const ext of headerExtensions) {
    const p = path.join(__dirname, '..', 'uploads', `footer.${ext}`);
    if (fs.existsSync(p)) {
                const imageData = fs.readFileSync(p);
        const base64 = imageData.toString('base64');
        const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
        footerImageUrl = `data:${mimeType};base64,${base64}`;
        break;
    }
  }

  // Check for tiranga background image
  let tirangaBgUrl = '';
  for (const ext of headerExtensions) {
    const p = path.join(__dirname, '..', 'uploads', `tiranga.${ext}`);
    if (fs.existsSync(p)) {
                const imageData = fs.readFileSync(p);
        const base64 = imageData.toString('base64');
        const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
        tirangaBgUrl = `data:${mimeType};base64,${base64}`;
        break;
    }
  }

  // Generate HTML
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; width: 210mm; }
        @page { size: A4; margin: 0; }
        .header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          text-align: center;
          z-index: 10;
        }
        .footer {
          position: fixed;
          bottom: 15px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 10px;
          color: #666;
          z-index: 10;
        }
        .full-bleed {
          width: 210mm;
          height: 297mm;
          position: relative;
          background: white;
          page-break-after: always;
          overflow: hidden;
          display: block;
          z-index: 100;
        }
        .full-bleed img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .section { 
          position: relative;
          z-index: 5;
          padding: 20px 40px; 
          background: white;
        }
        .section-title-page { 
          width: 210mm;
          height: 297mm;
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          align-items: center; 
          text-align: center;
          background: white;
          ${tirangaBgUrl ? `background-image: url('${tirangaBgUrl}'); background-size: 100% 100%; background-repeat: no-repeat;` : 'background: white;'}
          position: relative;
          z-index: 100;
          page-break-after: always;
          page-break-before: always;
        }
        .section-title-page:first-of-type {
          page-break-before: auto;
        }
        .section-title-page h1 {
          font-size: 42px;
          margin-bottom: 20px;
          color: #000;
        }
        .section-title-page h2 {
          font-size: 32px;
          color: #000;
          font-weight: normal;
        }
        .table-container { margin-top: 20px; overflow: hidden; }
        .table-title { font-size: 18px; color: #2980b9; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
        thead { display: table-header-group; }
        th, td { 
          border: 1px solid #e67e22; 
          padding: 10px 5px; 
          text-align: center; 
          vertical-align: middle;
          word-wrap: break-word; 
          overflow-wrap: break-word;
          font-size: 10px; 
          line-height: 1.3;
        }
        tr { page-break-inside: avoid; }
        th { background-color: #ed7d31; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #ffffff; }
        tr:nth-child(odd) { background-color: #fce4d6; }
        .screenshots-container { 
          page-break-before: always; 
          padding: 160px 40px 0 40px;
          background: white;
          position: relative;
          z-index: 100;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${headerImageUrl}" style="width: 100%; object-fit: contain;" />
      </div>
      <div class="footer">
        ${footerImageUrl ? `<img src="${footerImageUrl}" style="height: 30px; object-fit: contain; display: block; margin: 0 auto 5px auto;" />` : ''}
        Media Coverage Report | ${report.title}
      </div>
  `;

  // 1. Cover Pages
  if (report.coverPages && report.coverPages.length > 0) {
    for (const cp of report.coverPages) {
      if (cp.image) {
        html += `
          <div class="full-bleed">
            <img src="${getAbsoluteUrl(cp.image, true)}" />
          </div>
        `;
      }
    }
  } else if ((report as any).coverPage && (report as any).coverPage.image) {
    html += `
      <div class="full-bleed">
        <img src="${getAbsoluteUrl((report as any).coverPage.image, true)}" />
      </div>
    `;
  }

  const hasAnyCover = (report.coverPages && report.coverPages.length > 0) || ((report as any).coverPage && (report as any).coverPage.image);

  for (let i = 0; i < sectionsWithTables.length; i++) {
    const section = sectionsWithTables[i];
    
    if (section.type === 'custom' && section.image) {
      html += `
        <div class="full-bleed">
          <img src="${getAbsoluteUrl(section.image, true)}" />
        </div>
      `;
      continue;
    }

    // Section Title Page
    html += `
      <div class="section-title-page">
        <div style="${tirangaBgUrl ? '' : 'background: linear-gradient(to bottom, #f9d5b4 0%, #ffffff 30%, #ffffff 70%, #c1dfc4 100%);'} padding: 60px 40px; text-align: center; width: 80%; border-radius: 10px;">
          <h1 style="font-size: 42px; margin: 0; color: #000;">${section.title || section.name}</h1>
        </div>
      </div>
      <div class="section">
    `;
    
    for (const table of section.tables) {
      const isVisible = (col: string) => !(table.hiddenColumns || []).includes(col);
      
      html += `
        <div class="table-container">
          <table>
            <colgroup>
              ${isVisible('srNo') ? '<col style="width: 35px;">' : ''}
              ${isVisible('headline') ? '<col style="width: 25%;">' : ''}
              ${isVisible('publication') ? '<col style="width: 15%;">' : ''}
              ${isVisible('edition') ? '<col style="width: 12%;">' : ''}
              ${isVisible('pageNo') ? '<col style="width: 45px;">' : ''}
              ${isVisible('date') ? '<col style="width: 75px;">' : ''}
              ${isVisible('link') ? '<col style="width: 20%;">' : ''}
              ${isVisible('image') ? '<col style="width: 90px;">' : ''}
            </colgroup>
            <thead>
              <tr style="border: none !important; background: transparent !important;">
                ${isVisible('srNo') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
                ${isVisible('headline') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
                ${isVisible('publication') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
                ${isVisible('edition') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
                ${isVisible('pageNo') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
                ${isVisible('date') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
                ${isVisible('link') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
                ${isVisible('image') ? '<th style="border: none !important; background: transparent !important; height: 140px; padding: 0 !important;"></th>' : ''}
              </tr>
              <tr>
                ${isVisible('srNo') ? '<th>Sr. No.</th>' : ''}
                ${isVisible('headline') ? '<th>Headline</th>' : ''}
                ${isVisible('publication') ? '<th>Publication</th>' : ''}
                ${isVisible('edition') ? '<th>Edition</th>' : ''}
                ${isVisible('pageNo') ? '<th>Page No</th>' : ''}
                ${isVisible('date') ? '<th>Date</th>' : ''}
                ${isVisible('link') ? '<th>Link</th>' : ''}
                ${isVisible('image') ? '<th>Image</th>' : ''}
              </tr>
            </thead>
            <tbody>
      `;
      for (const row of table.rows) {
        html += `
              <tr>
                ${isVisible('srNo') ? `<td>${row.srNo || ''}</td>` : ''}
                ${isVisible('headline') ? `<td>${row.headline || ''}</td>` : ''}
                ${isVisible('publication') ? `<td>${row.publication || ''}</td>` : ''}
                ${isVisible('edition') ? `<td>${row.edition || ''}</td>` : ''}
                ${isVisible('pageNo') ? `<td>${row.pageNo || ''}</td>` : ''}
                ${isVisible('date') ? `<td>${row.date ? new Date(row.date).toLocaleDateString() : ''}</td>` : ''}
                ${isVisible('link') ? `<td>${row.link ? `<a href="${row.link}" target="_blank" style="color: #3498db; text-decoration: underline; word-break: break-all;">${row.link}</a>` : ''}</td>` : ''}
                ${isVisible('image') ? `<td>${(row as any).image ? `<a href="${getAbsoluteUrl((row as any).image)}" target="_blank" style="color: #3498db; text-decoration: underline;"><img src="${getAbsoluteUrl((row as any).image, true)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" /></a>` : ''}</td>` : ''}
              </tr>
        `;
      }
      html += `
            </tbody>
          </table>
        </div>
      `;

      // Screenshots on separate pages
      for (let j = 0; j < table.screenshots.length; j++) {
        const screenshot = table.screenshots[j];
        
        // Use absolute URL for puppeteer to load images
        const imageUrl = getAbsoluteUrl(screenshot.url, true);
        
        html += `
          <div class="screenshots-container">
            <div style="text-align: center;">
              <img src="${imageUrl}" alt="Screenshot" style="max-width: 100%; max-height: 80vh; object-fit: contain;" />
            </div>
          </div>
        `;
      }
    }
    html += `</div>`;
  }

  html += `
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Additional wait to ensure base64 images are decoded and rendered
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const pdfBuffer = await page.pdf({ 
    format: 'A4', 
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: '0',
      bottom: '0',
      left: '0',
      right: '0'
    }
  });

  await browser.close();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="Report-${report.title}.pdf"`
  });
  res.send(Buffer.from(pdfBuffer));
});
