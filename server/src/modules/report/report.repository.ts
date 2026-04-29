import Report from './models/report.model';
import Section from './models/section.model';
import CoverageTable from './models/coverageTable.model';

export const findReportsByQuery = async (query: any, skip: number = 0, limit: number = 10) => {
  return await Report.find(query).skip(skip).limit(limit).lean();
};

export const countReports = async (query: any) => {
  return await Report.countDocuments(query);
};

export const findReportById = async (id: string) => {
  return await Report.findById(id);
};

export const saveReport = async (report: any) => {
  return await report.save();
};

export const createReport = async (data: any) => {
  const report = new Report(data);
  return await report.save();
};

export const findSectionsByReportIds = async (reportIds: string[]) => {
  return await Section.find({ reportId: { $in: reportIds } });
};

export const findSectionsByReportId = async (reportId: string) => {
  return await Section.find({ reportId }).sort('order');
};

export const findSectionById = async (id: string) => {
  return await Section.findById(id);
};

export const countSectionsByReportId = async (reportId: string) => {
  return await Section.countDocuments({ reportId });
};

export const saveSection = async (section: any) => {
  return await section.save();
};

export const createSection = async (data: any) => {
  const section = new Section(data);
  return await section.save();
};

export const findTablesBySectionIds = async (sectionIds: string[], sort?: any, limit?: number) => {
  let query = CoverageTable.find({ sectionId: { $in: sectionIds } });
  if (sort) query = query.sort(sort);
  if (limit) query = query.limit(limit);
  return await query.exec();
};

export const findTablesBySectionId = async (sectionId: string) => {
  return await CoverageTable.find({ sectionId }).sort('order');
};

export const createTable = async (data: any) => {
  const table = new CoverageTable(data);
  return await table.save();
};
