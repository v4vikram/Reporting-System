import api from '../../../api/axios.ts';
import { Report, Section, CoverageTable, Row, Screenshot, CoverageItem } from '../types/index.ts';


export const reportService = {
  getReportStats: async () => {
    const { data } = await api.get<{ totalNews: number, onlineNews: number, printNews: number, tvNews: number }>('/reports/stats');
    return data;
  },
  getLatestCoverage: async (topOnly: boolean = false) => {
    const { data } = await api.get<CoverageItem[]>(`/reports/latest-coverage?topOnly=${topOnly}`);
    return data;
  },
  getReports: async (): Promise<Report[]> => {
    const { data } = await api.get<any>('/reports');
    return data && data.reports ? data.reports : (data as Report[]);
  },
  getReportById: async (id: string) => {
    const { data } = await api.get<Report>(`/reports/${id}`);
    return data;
  },
  createReport: async (reportData: Partial<Report>) => {
    const { data } = await api.post<Report>('/reports', reportData);
    return data;
  },
  updateReport: async (id: string, reportData: Partial<Report>) => {
    const { data } = await api.put<Report>(`/reports/${id}`, reportData);
    return data;
  },
  deleteReport: async (id: string) => {
    const { data } = await api.delete(`/reports/${id}`);
    return data;
  },
  duplicateReport: async (id: string) => {
    const { data } = await api.post<Report>(`/reports/${id}/duplicate`);
    return data;
  },
  createSection: async (reportId: string, sectionData: Partial<Section>) => {
    // console.log(reportId, sectionData, 'reportId, sectionData');
    const { data } = await api.post<Section>(`/reports/${reportId}/sections`, sectionData);
    return data;
  },
  updateSection: async (sectionId: string, sectionData: Partial<Section>) => {
    const { data } = await api.put<Section>(`/reports/sections/${sectionId}`, sectionData);
    return data;
  },
  deleteSection: async (sectionId: string) => {
    const { data } = await api.delete(`/reports/sections/${sectionId}`);
    return data;
  },
  duplicateSection: async (reportId: string, sectionId: string) => {
    const { data } = await api.post<Section[]>(`/reports/${reportId}/sections/${sectionId}/duplicate`);
    return data;
  },
  createTable: async (sectionId: string, tableData: Partial<CoverageTable>) => {
    console.log(sectionId, tableData, 'sectionId, tableData');
    const { data } = await api.post<CoverageTable>(`/reports/sections/${sectionId}/tables`, tableData);
    return data;
  },
  updateTable: async (tableId: string, tableData: Partial<CoverageTable>) => {
    const { data } = await api.put<CoverageTable>(`/reports/tables/${tableId}`, tableData);
    return data;
  },
  deleteTable: async (tableId: string) => {
    const { data } = await api.delete(`/reports/tables/${tableId}`);
    return data;
  },
  addRow: async (tableId: string, rowData: Partial<Row>) => {
    const { data } = await api.post<CoverageTable>(`/reports/tables/${tableId}/rows`, rowData);
    return data;
  },
  updateRow: async (tableId: string, rowId: string, rowData: Partial<Row>) => {
    const { data } = await api.put<CoverageTable>(`/reports/tables/${tableId}/rows/${rowId}`, rowData);
    return data;
  },
  deleteRow: async (tableId: string, rowId: string) => {
    const { data } = await api.delete<CoverageTable>(`/reports/tables/${tableId}/rows/${rowId}`);
    return data;
  },
  uploadScreenshots: async (tableId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const { data } = await api.post<CoverageTable>(`/reports/tables/${tableId}/screenshots`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  uploadRowImage: async (tableId: string, rowId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post<CoverageTable>(`/reports/tables/${tableId}/rows/${rowId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  downloadPdf: async (id: string, title: string) => {
    const response = await api.get(`/reports/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report-${title}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
