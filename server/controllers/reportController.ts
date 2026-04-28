import { Request, Response } from 'express';
import Report from '../models/Report';
import Section from '../models/Section';
import CoverageTable from '../models/CoverageTable';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

const getAbsoluteUrl = (url: string, isInternal = false) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  // For Puppeteer internal requests, we prefer localhost to avoid networking loop issues with external URLs
  const baseUrl = isInternal 
    ? `http://127.0.0.1:${process.env.PORT || 3000}`
    : (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`);
    
  // Ensure we don't have double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBaseUrl}${cleanUrl}`;
};

// Reports
export const createReport = async (req: Request, res: Response) => {
  try {
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
    res.status(201).json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    
    // Clients can see all reports assigned to them to track draft progress
    const query = userRole === 'client' ? { clientId: userId } : {};
    
    const reports = await Report.find(query)
      .populate('clientId', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ updatedAt: -1 })
      .lean();

    const reportsWithCategories = await Promise.all(reports.map(async (report) => {
      const tables = await CoverageTable.find({ reportId: report._id }).select('category');
      const categories = new Set<string>();
      tables.forEach(t => {
        if (t.category) categories.add(t.category);
      });
      return { ...report, aggregatedCategories: Array.from(categories) };
    }));

    res.json(reportsWithCategories);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReportStats = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    
    // For clients, show reports assigned to them. 
    // We remove the strict 'published' filter for the dashboard to show progress, 
    // but you can add it back if you want clients to only see final reports.
    const query = userRole === 'client' ? { clientId: userId } : {};
    
    const reports = await Report.find(query);
    const reportIds = reports.map(r => r._id);

    const sections = await Section.find({ reportId: { $in: reportIds } });
    const sectionIds = sections.map(s => s._id);

    const tables = await CoverageTable.find({ sectionId: { $in: sectionIds } });

    let totalNews = 0;
    let onlineNews = 0;
    let printNews = 0;
    let tvNews = 0;

    for (const table of tables) {
      const rowCount = table.rows.length;
      totalNews += rowCount;

      const section = sections.find(s => s._id.toString() === table.sectionId.toString());
      if (section) {
        const sectionName = section.name.toLowerCase();
        if (sectionName.includes('online')) {
          onlineNews += rowCount;
        } else if (sectionName.includes('print')) {
          printNews += rowCount;
        } else if (sectionName.includes('tv') || sectionName.includes('television')) {
          tvNews += rowCount;
        }
      }
    }

    res.json({
      totalNews,
      onlineNews,
      printNews,
      tvNews
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLatestCoverage = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const topOnly = req.query.topOnly === 'true';
    
    const query = userRole === 'client' ? { clientId: userId } : {};
    const reports = await Report.find(query);
    const reportIds = reports.map(r => r._id);

    const sections = await Section.find({ reportId: { $in: reportIds } });
    const sectionIds = sections.map(s => s._id);

    // Get recently updated tables that belong to the visible sections
    const tables = await CoverageTable.find({ sectionId: { $in: sectionIds } })
      .sort({ updatedAt: -1 })
      .limit(50); 

    let latestCoverage: any[] = [];

    for (const table of tables) {
      const section = sections.find(s => s._id.toString() === table.sectionId.toString());
      let type = 'Online';
      if (section) {
        const sectionName = section.name.toLowerCase();
        if (sectionName.includes('print')) type = 'Print';
        else if (sectionName.includes('tv') || sectionName.includes('television')) type = 'TV';
      }

      for (const row of table.rows) {
        const rowObj = (row as any).toObject ? (row as any).toObject() : row;
        
        // Filter by isTopCoverage if requested
        if (topOnly && !rowObj.isTopCoverage) continue;

        // Use row date if available, otherwise extract from ID or use table updatedAt
        let createdAt = rowObj.date ? new Date(rowObj.date) : null;
        if (!createdAt || isNaN(createdAt.getTime())) {
          createdAt = (row as any)._id 
            ? new Date(parseInt((row as any)._id.toString().substring(0, 8), 16) * 1000) 
            : table.updatedAt;
        }
        
        latestCoverage.push({
          id: rowObj._id || Math.random().toString(),
          headline: rowObj.headline,
          link: rowObj.link,
          type,
          isTopCoverage: rowObj.isTopCoverage,
          createdAt
        });
      }
    }

    // Sort by createdAt descending
    latestCoverage.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    
    res.json(latestCoverage.slice(0, 10));
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('clientId', 'name email role')
      .populate('assignedTo', 'name email role');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    if ((req as any).user?.role === 'client' && (report.clientId._id.toString() !== (req as any).user.id.toString() || report.status !== 'published')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const sections = await Section.find({ reportId: report._id }).sort('order');
    const sectionsWithTables = await Promise.all(sections.map(async (section) => {
      const tables = await CoverageTable.find({ sectionId: section._id }).sort('order');
      return { ...section.toObject(), tables };
    }));

    res.json({ ...report.toObject(), sections: sectionsWithTables });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReport = async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteReport = async (req: Request, res: Response) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    await Section.deleteMany({ reportId: req.params.id });
    await CoverageTable.deleteMany({ reportId: req.params.id });
    res.json({ message: 'Report removed' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const duplicateReport = async (req: Request, res: Response) => {
  try {
    const originalReport = await Report.findById(req.params.id);
    if (!originalReport) return res.status(404).json({ message: 'Report not found' });

    // 1. Duplicate Report
    const newReport = new Report({
      clientId: originalReport.clientId,
      title: `${originalReport.title} (Copy)`,
      month: originalReport.month,
      date: originalReport.date,
      time: originalReport.time,
      category: originalReport.category,
      status: 'draft',
      assignedTo: originalReport.assignedTo,
      createdBy: (req as any).user?.id,
      coverPages: originalReport.coverPages
    });
    await newReport.save();

    // 2. Duplicate Sections
    const originalSections = await Section.find({ reportId: originalReport._id }).sort('order');
    for (const section of originalSections) {
      const newSection = new Section({
        reportId: newReport._id,
        name: section.name,
        title: section.title,
        type: section.type,
        content: section.content,
        image: section.image,
        order: section.order
      });
      await newSection.save();

      // 3. Duplicate Tables for this section
      const originalTables = await CoverageTable.find({ sectionId: section._id }).sort('order');
      for (const table of originalTables) {
        const newTable = new CoverageTable({
          reportId: newReport._id,
          sectionId: newSection._id,
          title: table.title,
          category: table.category,
          order: table.order,
          rows: table.rows.map(r => ({ 
            srNo: r.srNo,
            headline: r.headline,
            publication: r.publication,
            edition: r.edition,
            pageNo: r.pageNo,
            date: r.date,
            link: r.link,
            image: r.image
          })),
          screenshots: table.screenshots.map(s => ({
            url: s.url,
            caption: s.caption,
            order: s.order
          }))
        });
        await newTable.save();
      }
    }

    res.status(201).json(newReport);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};


// Sections
export const createSection = async (req: Request, res: Response) => {
  try {
    const section = new Section({ ...req.body, reportId: req.params.reportId });
    await section.save();
    res.status(201).json(section);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSection = async (req: Request, res: Response) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.sectionId, req.body, { new: true });
    res.json(section);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSection = async (req: Request, res: Response) => {
  try {
    await Section.findByIdAndDelete(req.params.sectionId);
    await CoverageTable.deleteMany({ sectionId: req.params.sectionId });
    res.json({ message: 'Section removed' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Tables
export const createTable = async (req: Request, res: Response) => {
  try {
    const section = await Section.findById(req.params.sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    const table = new CoverageTable({ ...req.body, sectionId: section._id, reportId: section.reportId });
    await table.save();
    res.status(201).json(table);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const table = await CoverageTable.findByIdAndUpdate(req.params.tableId, req.body, { new: true });
    res.json(table);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    await CoverageTable.findByIdAndDelete(req.params.tableId);
    res.json({ message: 'Table removed' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Rows
export const addRow = async (req: Request, res: Response) => {
  try {
    const table = await CoverageTable.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    table.rows.push(req.body);
    await table.save();
    res.status(201).json(table);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Sections
export const duplicateSection = async (req: Request, res: Response) => {
  try {
    const sectionToDuplicate = await Section.findById(req.params.sectionId);
    if (!sectionToDuplicate) return res.status(404).json({ message: 'Section not found' });
    
    // Create a new section
    const newSection = new Section({
      reportId: sectionToDuplicate.reportId,
      name: `${sectionToDuplicate.name} (Copy)`,
      title: sectionToDuplicate.title,
      type: sectionToDuplicate.type,
      content: sectionToDuplicate.content,
      image: sectionToDuplicate.image,
      order: (await Section.countDocuments({ reportId: sectionToDuplicate.reportId }))
    });
    await newSection.save();

    // Duplicate all tables in the section
    const originalTables = await CoverageTable.find({ sectionId: sectionToDuplicate._id });
    for (const table of originalTables) {
      const newTable = new CoverageTable({
        reportId: table.reportId,
        sectionId: newSection._id,
        title: table.title,
        category: table.category,
        order: table.order,
        rows: table.rows.map(r => ({ 
          srNo: r.srNo,
          headline: r.headline,
          publication: r.publication,
          edition: r.edition,
          pageNo: r.pageNo,
          date: r.date,
          link: r.link,
          image: r.image
        })),
        screenshots: table.screenshots.map(s => ({ 
          url: s.url,
          caption: s.caption,
          order: s.order
        }))
      });
      await newTable.save();
    }

    // Return updated sections list for the report with tables populated
    const sections = await Section.find({ reportId: sectionToDuplicate.reportId }).sort('order');
    const sectionsWithTables = await Promise.all(sections.map(async (section) => {
      const tables = await CoverageTable.find({ sectionId: section._id }).sort('order');
      return { ...section.toObject(), tables };
    }));
    
    res.status(201).json(sectionsWithTables);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};



export const updateRow = async (req: Request, res: Response) => {
  try {
    const table = await CoverageTable.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const row = (table.rows as any).id(req.params.rowId);
    if (!row) return res.status(404).json({ message: 'Row not found' });

    Object.assign(row, req.body);
    await table.save();
    res.json(table);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRow = async (req: Request, res: Response) => {
  try {
    const table = await CoverageTable.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    (table.rows as any).pull({ _id: req.params.rowId });
    await table.save();
    res.json(table);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Screenshots
export const uploadScreenshots = async (req: Request, res: Response) => {
  try {
    const table = await CoverageTable.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ message: 'No files uploaded' });
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadRowImage = async (req: Request, res: Response) => {
  try {
    const table = await CoverageTable.findById(req.params.tableId);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    const row = (table.rows as any).id(req.params.rowId);
    if (!row) return res.status(404).json({ message: 'Row not found' });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// PDF Generation
export const generatePDF = async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.id).populate('clientId', 'name');
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if ((req as any).user?.role === 'client' && (report.clientId._id.toString() !== (req as any).user.id.toString() || report.status !== 'published')) {
      return res.status(403).json({ message: 'Not authorized' });
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
        try {
          const imageData = fs.readFileSync(p);
          const base64 = imageData.toString('base64');
          const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
          headerImageUrl = `data:${mimeType};base64,${base64}`;
          break;
        } catch (err) {
          console.error("Error reading header image:", err);
        }
      }
    }

    // Check for custom footer image in uploads folder
    let footerImageUrl = '';
    for (const ext of headerExtensions) {
      const p = path.join(__dirname, '..', 'uploads', `footer.${ext}`);
      if (fs.existsSync(p)) {
        try {
          const imageData = fs.readFileSync(p);
          const base64 = imageData.toString('base64');
          const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
          footerImageUrl = `data:${mimeType};base64,${base64}`;
          break;
        } catch (err) {
          console.error("Error reading footer image:", err);
        }
      }
    }

    // Check for tiranga background image
    let tirangaBgUrl = '';
    for (const ext of headerExtensions) {
      const p = path.join(__dirname, '..', 'uploads', `tiranga.${ext}`);
      if (fs.existsSync(p)) {
        try {
          const imageData = fs.readFileSync(p);
          const base64 = imageData.toString('base64');
          const mimeType = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
          tirangaBgUrl = `data:${mimeType};base64,${base64}`;
          break;
        } catch (err) {
          console.error("Error reading tiranga image:", err);
        }
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
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
