import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Download, Trash2, Edit, Copy, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore.ts';
import Modal from '../../../components/Modal.tsx';
import { useReports, useDeleteReport, useDuplicateReport } from '../../../hooks/useReports.ts';
import { useClients } from '../../../hooks/useUsers.ts';
import { reportService } from '../api/reportService.ts';

export default function ReportsList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'employee';

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filter States
  const [filterTitle, setFilterTitle] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { data: reports, isLoading } = useReports();
  const { data: allClients } = useClients({ enabled: isAdmin });
  const deleteMutation = useDeleteReport();
  const duplicateMutation = useDuplicateReport();

  // Extract unique clients and dates for filters
  const clients = useMemo(() => {
    if (isAdmin && allClients) {
      return (allClients as any[]).map(c => c.name);
    }
    return Array.from(new Set(reports?.map(r => (r.clientId as any)?.name).filter(Boolean)));
  }, [reports, isAdmin, allClients]);

  const categories = useMemo(() => {
    const allCats = reports?.flatMap(r => r.aggregatedCategories || []) || [];
    return Array.from(new Set(allCats)).sort();
  }, [reports]);

  const filteredReports = useMemo(() => reports?.filter(report => {
    const titleMatch = report.title.toLowerCase().includes(filterTitle.toLowerCase());
    const clientMatch = filterClient === '' || (report.clientId as any)?.name === filterClient;
    
    let dateMatch = true;
    if (startDate && endDate) {
      dateMatch = report.date >= startDate && report.date <= endDate;
    } else if (startDate) {
      dateMatch = report.date >= startDate;
    } else if (endDate) {
      dateMatch = report.date <= endDate;
    }

    const categoryMatch = filterCategory === '' || (report.aggregatedCategories || []).includes(filterCategory);
    return titleMatch && clientMatch && dateMatch && categoryMatch;
  }), [reports, filterTitle, filterClient, startDate, endDate, filterCategory]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDownload = async (id: string, title: string) => {
    try {
      await reportService.downloadPdf(id, title);
    } catch (error) {
      console.error('Failed to download PDF', error);
      setErrorMsg('Failed to download PDF');
    }
  };

  const confirmDelete = (id: string) => {
    setReportToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id, {
      onError: (error) => {
        console.error('Failed to duplicate report', error);
        setErrorMsg('Failed to duplicate report');
      }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-secondary">Loading reports...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Reports</h1>
          <p className="text-text-secondary mt-1">Manage and view all media coverage reports</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate('/reports/new')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Report
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Search Title</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search..."
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Client</label>
          <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none">
            <option value="">All Clients</option>
            {(clients as any[]).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none" 
          />
        </div>
        <div className="pb-2">
          <button onClick={() => {setFilterTitle(''); setFilterClient(''); setStartDate(''); setEndDate(''); setFilterCategory('');}} className="text-sm text-text-secondary hover:text-accent font-medium">Clear Filters</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports?.map((report) => (
          <div key={report._id} className="bg-card border border-border rounded-lg p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{report.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {formatDate(report.date)} {report.time && `at ${report.time}`}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${report.status === 'published' ? 'bg-green-500/10 text-success' : 'bg-yellow-500/10 text-yellow-500'}`}>
                {report.status}
              </span>
            </div>
            
            <div className="mb-4 text-xs text-text-secondary space-y-2">
              <div className="flex flex-wrap gap-2">
                {report.aggregatedCategories && report.aggregatedCategories.length > 0 ? (
                  report.aggregatedCategories.map((cat, idx) => (
                    <span key={idx} className="bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/20 font-medium">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-text-secondary italic">No Category</span>
                )}
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                {(report.clientId as any).role === 'client' ? 'Client' : ((report.clientId as any).role === 'super_admin' ? 'Admin' : 'Employee')}: {typeof report.clientId === 'object' ? (report.clientId as any).name : 'Unknown'}
                {report.assignedTo && (
                  <div className="mt-1">Assigned: {typeof report.assignedTo === 'object' ? (report.assignedTo as any).name : report.assignedTo}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(report._id, report.title)}
                  className="p-2 text-text-secondary hover:text-accent transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => duplicateMutation.mutate(report._id)}
                      disabled={duplicateMutation.isPending}
                      className="p-2 text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
                      title="Duplicate Report"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/reports/${report._id}`)}
                      className="p-2 text-text-secondary hover:text-accent transition-colors"
                      title="Edit Report"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmDelete(report._id)}
                      className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredReports?.length === 0 && (
          <div className="col-span-full py-16 text-center text-text-secondary bg-card border border-border rounded-xl">
            <div className="mb-2 flex justify-center">
              <FileText className="w-12 h-12 text-text-secondary/20" />
            </div>
            <p className="text-lg font-medium text-text-primary">No reports found</p>
            <p className="text-sm">
              {filterTitle || filterClient || startDate || endDate || filterCategory ? 'No reports matching your filters.' : 'Get started by creating your first report.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Report"
      >
        <div className="space-y-4">
          <p className="text-text-primary">Are you sure you want to delete this report? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (reportToDelete) {
                  deleteMutation.mutate(reportToDelete, {
                    onSuccess: () => {
                      setIsDeleteModalOpen(false);
                      setReportToDelete(null);
                    },
                    onError: (error) => {
                      console.error('Failed to delete report', error);
                      setErrorMsg('Failed to delete report');
                      setIsDeleteModalOpen(false);
                    }
                  });
                }
              }}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal 
        isOpen={!!errorMsg} 
        onClose={() => setErrorMsg('')}
        title="Notice"
      >
        <div className="space-y-4">
          <p className="text-text-primary">{errorMsg}</p>
          <div className="flex justify-end mt-6">
            <button 
              onClick={() => setErrorMsg('')}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
