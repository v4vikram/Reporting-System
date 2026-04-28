import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../features/reports/api/reportService.ts';
import { Report, Section, CoverageTable, Row, CoverageItem } from '../features/reports/types/index.ts';

export const useReportStats = () => {
  return useQuery({
    queryKey: ['reportStats'],
    queryFn: reportService.getReportStats
  });
};

export const useLatestCoverage = (topOnly: boolean = false) => {
  return useQuery({
    queryKey: ['latestCoverage', topOnly ? 'topOnly' : 'all'],
    queryFn: () => reportService.getLatestCoverage(topOnly)
  });
};

export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: reportService.getReports
  });
};

export const useReport = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportService.getReportById(id),
    ...options
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Report>) => reportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Report> }) => reportService.updateReport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', variables.id] });
    }
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });
};

export const useDuplicateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportService.duplicateReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });
};

// --- Sections ---

export const useCreateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: Partial<Section> }) => reportService.createSection(reportId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.reportId] });
    }
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, data, reportId }: { sectionId: string; data: Partial<Section>, reportId?: string }) => reportService.updateSection(sectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, reportId }: { sectionId: string, reportId?: string }) => reportService.deleteSection(sectionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });
};

export const useDuplicateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, sectionId }: { reportId: string; sectionId: string }) => reportService.duplicateSection(reportId, sectionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.reportId] });
    }
  });
};
