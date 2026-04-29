import * as reportRepository from './report.repository';

export const getReportStats = async (userRole: string | undefined, userId: string | undefined) => {
  try {
    const query = userRole === 'client' ? { clientId: userId } : {};
    
    const reports = await reportRepository.findReportsByQuery(query);
    const reportIds = reports.map(r => String(r._id));

    const sections = await reportRepository.findSectionsByReportIds(reportIds);
    const sectionIds = sections.map(s => String(s._id));

    const tables = await reportRepository.findTablesBySectionIds(sectionIds);

    let totalNews = 0;
    let onlineNews = 0;
    let printNews = 0;
    let tvNews = 0;

    for (const table of tables) {
      if (!table || !table.rows) continue;
      
      const rowCount = table.rows.length;
      totalNews += rowCount;

      if (!table.sectionId) continue;
      
      const section = sections.find(s => s && s._id && s._id.toString() === table.sectionId.toString());
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

    return {
      totalNews,
      onlineNews,
      printNews,
      tvNews
    };
  } catch (error) {
    console.error('CRITICAL: getReportStats failed:', error);
    throw error;
  }
};

export const getLatestCoverage = async (userRole: string | undefined, userId: string | undefined, topOnly: boolean) => {
  try {
    const query = userRole === 'client' ? { clientId: userId } : {};
    const reports = await reportRepository.findReportsByQuery(query);
    const reportIds = reports.map(r => String(r._id));

    const sections = await reportRepository.findSectionsByReportIds(reportIds);
    const sectionIds = sections.map(s => String(s._id));

    // Get recently updated tables that belong to the visible sections
    const tables = await reportRepository.findTablesBySectionIds(sectionIds, { updatedAt: -1 }, 50); 

    let latestCoverage: any[] = [];

    for (const table of tables) {
      if (!table || !table.rows || !table.sectionId) continue;
      
      const section = sections.find(s => s && s._id && s._id.toString() === table.sectionId.toString());
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
    
    return latestCoverage.slice(0, 10);
  } catch (error) {
    console.error('CRITICAL: getLatestCoverage failed:', error);
    throw error;
  }
};

export const duplicateSection = async (sectionId: string) => {
  const sectionToDuplicate = await reportRepository.findSectionById(sectionId);
  if (!sectionToDuplicate) throw new Error('Section not found');
  
  // Create a new section
  const newSection = await reportRepository.createSection({
    reportId: sectionToDuplicate.reportId,
    name: `${sectionToDuplicate.name} (Copy)`,
    title: sectionToDuplicate.title,
    type: sectionToDuplicate.type,
    content: sectionToDuplicate.content,
    image: sectionToDuplicate.image,
    order: (await reportRepository.countSectionsByReportId(String(sectionToDuplicate.reportId)))
  });
  

  // Duplicate all tables in the section
  const originalTables = await reportRepository.findTablesBySectionId(String((sectionToDuplicate as any)._id || sectionToDuplicate._id));
  for (const table of originalTables) {
    const newTable = await reportRepository.createTable({
      reportId: table.reportId,
      sectionId: newSection._id,
      title: table.title,
      category: table.category,
      order: table.order,
      rows: table.rows.map((r: any) => ({ 
        srNo: r.srNo,
        headline: r.headline,
        publication: r.publication,
        edition: r.edition,
        pageNo: r.pageNo,
        date: r.date,
        link: r.link,
        image: r.image
      })),
      screenshots: table.screenshots.map((s: any) => ({ 
        url: s.url,
        caption: s.caption,
        order: s.order
      }))
    });
    
  }

  // Return updated sections list for the report with tables populated
  const sections = await reportRepository.findSectionsByReportId(String(sectionToDuplicate.reportId));
  const sectionsWithTables = await Promise.all(sections.map(async (section: any) => {
    const tables = await reportRepository.findTablesBySectionId(String(section._id));
    return { ...section.toObject(), tables };
  }));
  
  return sectionsWithTables;
};

export const duplicateReport = async (reportId: string, userId: string | undefined) => {
  const originalReport = await reportRepository.findReportById(reportId);
  if (!originalReport) throw new Error('Report not found');

  // 1. Duplicate Report
  const newReport = await reportRepository.createReport({
    clientId: originalReport.clientId,
    title: `${originalReport.title} (Copy)`,
    month: originalReport.month,
    date: originalReport.date,
    time: originalReport.time,
    category: originalReport.category,
    status: 'draft',
    assignedTo: originalReport.assignedTo,
    createdBy: userId,
    coverPages: originalReport.coverPages
  });
  

  // 2. Duplicate Sections
  const originalSections = await reportRepository.findSectionsByReportId(String(originalReport._id));
  for (const section of originalSections) {
    const newSection = await reportRepository.createSection({
      reportId: newReport._id,
      name: section.name,
      title: section.title,
      type: section.type,
      content: section.content,
      image: section.image,
      order: section.order
    });
    

    // 3. Duplicate Tables for this section
    const originalTables = await reportRepository.findTablesBySectionId(String(section._id));
    for (const table of originalTables) {
      const newTable = await reportRepository.createTable({
        reportId: newReport._id,
        sectionId: newSection._id,
        title: table.title,
        category: table.category,
        order: table.order,
        rows: table.rows.map((r: any) => ({ 
          srNo: r.srNo,
          headline: r.headline,
          publication: r.publication,
          edition: r.edition,
          pageNo: r.pageNo,
          date: r.date,
          link: r.link,
          image: r.image
        })),
        screenshots: table.screenshots.map((s: any) => ({
          url: s.url,
          caption: s.caption,
          order: s.order
        }))
      });
      
    }
  }

  return newReport;
};
