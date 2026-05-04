import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, FileText, Download, Trash2, Edit, Copy,
  Search, Calendar, User, Tag, X, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore.ts';
import Modal from '../../../components/Modal.tsx';
import { useReports, useDeleteReport, useDuplicateReport } from '../../../hooks/useReports.ts';
import { useClients } from '../../../hooks/useUsers.ts';
import { reportService } from '../api/reportService.ts';

/* ─── Helpers ────────────────────────────────────────────── */
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-border/60 ${className}`} />
);

const STATUS_CONFIG: Record<string, string> = {
  published: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  draft:     'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
};
const getStatusStyle = (s: string) => STATUS_CONFIG[s] ?? 'bg-border/20 text-text-secondary ring-1 ring-border';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const roleLabel = (role: string) =>
  role === 'client' ? 'Client' : role === 'super_admin' ? 'Admin' : 'Employee';

/* ─── Filter input shared style ─────────────────────────── */
const inputCls =
  'w-full bg-bg border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all';

/* ─── Skeleton card ──────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
      <div className="border-t border-border/50 pt-3 flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-8 h-8 rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ReportsList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'employee';

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filterTitle, setFilterTitle] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { data: reports, isLoading } = useReports();
  const { data: allClients } = useClients({ enabled: isAdmin });
  const deleteMutation = useDeleteReport();
  const duplicateMutation = useDuplicateReport();

  const clients = useMemo(() => {
    if (isAdmin && allClients) return (allClients as any[]).map(c => c.name);
    return Array.from(new Set(reports?.map(r => (r.clientId as any)?.name).filter(Boolean)));
  }, [reports, isAdmin, allClients]);

  const categories = useMemo(() => {
    const all = reports?.flatMap(r => r.aggregatedCategories || []) || [];
    return Array.from(new Set(all)).sort();
  }, [reports]);

  const activeFilterCount = [filterTitle, filterClient, startDate, endDate, filterCategory].filter(Boolean).length;

  const clearFilters = () => {
    setFilterTitle(''); setFilterClient('');
    setStartDate(''); setEndDate(''); setFilterCategory('');
  };

  const filteredReports = useMemo(() => reports?.filter(report => {
    const titleMatch = report.title.toLowerCase().includes(filterTitle.toLowerCase());
    const clientMatch = !filterClient || (report.clientId as any)?.name === filterClient;
    const categoryMatch = !filterCategory || (report.aggregatedCategories || []).includes(filterCategory);
    let dateMatch = true;
    if (startDate) dateMatch = dateMatch && report.date >= startDate;
    if (endDate) dateMatch = dateMatch && report.date <= endDate;
    return titleMatch && clientMatch && dateMatch && categoryMatch;
  }), [reports, filterTitle, filterClient, startDate, endDate, filterCategory]);

  const handleDownload = async (id: string, title: string) => {
    try {
      await toast.promise(reportService.downloadPdf(id, title), {
        loading: 'Generating PDF…',
        success: 'PDF downloaded!',
        error: 'Failed to download PDF',
      });
    } catch (e) { console.error(e); }
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id, {
      onSuccess: () => toast.success('Report duplicated'),
      onError: () => toast.error('Failed to duplicate report'),
    });
  };

  const handleDelete = () => {
    if (!reportToDelete) return;
    deleteMutation.mutate(reportToDelete, {
      onSuccess: () => { toast.success('Report deleted'); setIsDeleteModalOpen(false); setReportToDelete(null); },
      onError: () => { toast.error('Failed to delete report'); setIsDeleteModalOpen(false); },
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-accent/70 mb-0.5">
            Media Intelligence
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            Reports
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage and view all media coverage reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isLoading && filteredReports && filteredReports.length > 0 && (
            <span className="text-xs font-semibold text-accent bg-accent/10 ring-1 ring-accent/20 px-3 py-1.5 rounded-full">
              {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
            </span>
          )}
          {isAdmin && (
            <button
              onClick={() => navigate('/reports/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-xl shadow-lg shadow-accent/20 transition-all hover:shadow-accent/30 hover:-translate-y-px active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              Create Report
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Toggle header */}
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-bg/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {/* Search inline on all sizes */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Search reports…"
                value={filterTitle}
                onChange={e => setFilterTitle(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm bg-bg border border-border rounded-xl text-text-primary placeholder:text-text-secondary/40 outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all w-44 sm:w-60"
              />
            </div>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Collapsible filter grid */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 border-t border-border/60 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Client */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    <User className="w-3 h-3" /> Client
                  </label>
                  <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className={inputCls}>
                    <option value="">All Clients</option>
                    {(clients as string[]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    <Tag className="w-3 h-3" /> Category
                  </label>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={inputCls}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Start date */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3 h-3" /> From
                  </label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                </div>

                {/* End date */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3 h-3" /> To
                  </label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="px-4 sm:px-5 pb-4">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredReports && filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence>
            {filteredReports.map((report, i) => {
              const client = report.clientId as any;
              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 bg-accent/10 ring-1 ring-accent/20 rounded-xl shrink-0 group-hover:bg-accent/15 transition-colors">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-2">
                          {report.title}
                        </h3>
                        <p className="text-[11px] text-text-secondary/70 mt-0.5">
                          {formatDate(report.date)}
                          {report.time && <> · {report.time}</>}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${getStatusStyle(report.status)}`}>
                      {report.status}
                    </span>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
                    {report.aggregatedCategories?.length ? (
                      report.aggregatedCategories.map((cat, idx) => (
                        <span key={idx} className="text-[10px] font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-md ring-1 ring-accent/20">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-text-secondary/50 italic">No category</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-text-secondary/70 min-w-0">
                      <p className="truncate">
                        <span className="font-semibold text-text-secondary">{roleLabel(client?.role ?? '')}</span>
                        {': '}
                        {typeof client === 'object' ? client?.name : 'Unknown'}
                      </p>
                      {report.assignedTo && (
                        <p className="truncate mt-0.5">
                          Assigned: {typeof report.assignedTo === 'object' ? (report.assignedTo as any).name : report.assignedTo}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDownload(report._id, report.title)}
                        className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleDuplicate(report._id)}
                            disabled={duplicateMutation.isPending}
                            className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/reports/${report._id}`)}
                            className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setReportToDelete(report._id); setIsDeleteModalOpen(true); }}
                            className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 flex flex-col items-center gap-3 text-text-secondary bg-card border border-border rounded-2xl"
        >
          <FileText className="w-12 h-12 opacity-15" />
          <p className="text-base font-semibold text-text-primary">No reports found</p>
          <p className="text-sm">
            {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Create your first report to get started.'}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-1 text-xs font-semibold text-accent hover:underline">
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* ── Delete modal ── */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Report">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-text-primary leading-snug">
              Are you sure you want to delete this report? This action{' '}
              <span className="font-semibold text-red-400">cannot be undone</span>.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border hover:border-accent/30 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60 shadow-sm shadow-red-500/20"
            >
              {deleteMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
              ) : (
                <><Trash2 className="w-4 h-4" />Delete Report</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}