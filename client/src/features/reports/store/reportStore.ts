import { create } from 'zustand';
import { Report, Section, CoverageTable, Row, Screenshot } from '../types/index.ts';
import { reportService } from '../api/reportService.ts';


interface ReportState {
  activeReport: Report | null;
  setActiveReport: (report: Report | null) => void;
  updateReportField: (field: keyof Report, value: any) => void;
  addSection: (section: Section) => void;
  updateSection: (sectionId: string, data: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  addTable: (sectionId: string, table: CoverageTable) => void;
  updateTable: (sectionId: string, tableId: string, data: Partial<CoverageTable>) => void;
  deleteTable: (sectionId: string, tableId: string) => void;
  updateTableData: (sectionId: string, table: CoverageTable) => void; 
  setSections: (sections: Section[]) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  activeReport: null,
  setActiveReport: (report) => set({ activeReport: report }),
  updateReportField: (field, value) => set((state) => ({
    activeReport: state.activeReport ? { ...state.activeReport, [field]: value } : null
  })),
  addSection: (section) => set((state) => {
    if (!state.activeReport) return state;
    return {
      activeReport: {
        ...state.activeReport,
        sections: [...(state.activeReport.sections || []), section]
      }
    };
  }),
  updateSection: (sectionId, data) => set((state) => {
    if (!state.activeReport || !state.activeReport.sections) return state;
    return {
      activeReport: {
        ...state.activeReport,
        sections: state.activeReport.sections.map(s => s._id === sectionId ? { ...s, ...data } : s)
      }
    };
  }),
  deleteSection: (sectionId) => set((state) => {
    if (!state.activeReport || !state.activeReport.sections) return state;
    return {
      activeReport: {
        ...state.activeReport,
        sections: state.activeReport.sections.filter(s => s._id !== sectionId)
      }
    };
  }),
  addTable: (sectionId, table) => set((state) => {
    if (!state.activeReport || !state.activeReport.sections) return state;
    return {
      activeReport: {
        ...state.activeReport,
        sections: state.activeReport.sections.map(s => {
          if (s._id === sectionId) {
            return { ...s, tables: [...(s.tables || []), table] };
          }
          return s;
        })
      }
    };
  }),
  updateTable: (sectionId, tableId, data) => set((state) => {
    if (!state.activeReport || !state.activeReport.sections) return state;
    return {
      activeReport: {
        ...state.activeReport,
        sections: state.activeReport.sections.map(s => {
          if (s._id === sectionId && s.tables) {
            return {
              ...s,
              tables: s.tables.map(t => t._id === tableId ? { ...t, ...data } : t)
            };
          }
          return s;
        })
      }
    };
  }),
  deleteTable: (sectionId, tableId) => set((state) => {
    if (!state.activeReport || !state.activeReport.sections) return state;
    return {
      activeReport: {
        ...state.activeReport,
        sections: state.activeReport.sections.map(s => {
          if (s._id === sectionId && s.tables) {
            return {
              ...s,
              tables: s.tables.filter(t => t._id !== tableId)
            };
          }
          return s;
        })
      }
    };
  }),
  updateTableData: (sectionId, table) => set((state) => {
    if (!state.activeReport || !state.activeReport.sections) return state;
    return {
      activeReport: {
        ...state.activeReport,
        sections: state.activeReport.sections.map(s => {
          if (s._id === sectionId && s.tables) {
            return {
              ...s,
              tables: s.tables.map(t => t._id === table._id ? table : t)
            };
          }
          return s;
        })
      }
    };
  }),
  setSections: (sections) => set((state) => ({
    activeReport: state.activeReport ? { ...state.activeReport, sections } : null
  }))
}));
