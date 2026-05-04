import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import CustomPageEditor from '../../../components/CustomPageEditor.tsx';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Save, ArrowLeft, Plus, FileText, LayoutTemplate,
  Layers, AlertCircle, User, FolderOpen, Calendar, Clock,
  ChevronDown, GripVertical, Info,
} from 'lucide-react';
import { useReportStore } from '../store/reportStore.ts';
import SectionManager from '../components/SectionManager.tsx';
import Modal from '../../../components/Modal.tsx';
import {
  useReport, useCreateReport, useUpdateReport,
  useCreateSection, useUpdateSection,
} from '../../../hooks/useReports.ts';
import { useClients, useEmployees } from '../../../hooks/useUsers.ts';
import { useProjects } from '../../../hooks/useProjects.ts';

/* ─── Schema ─────────────────────────────────────────────── */
const reportSchema = z.object({
  title:      z.string().min(1, 'Title is required'),
  projectId:  z.string().min(1, 'Project is required'),
  clientId:   z.string().min(1, 'Client is required'),
  month:      z.string().min(1, 'Month is required'),
  date:       z.string().optional(),
  time:       z.string().optional(),
  status:     z.enum(['draft', 'published']),
  assignedTo: z.string().optional(),
});
type ReportFormData = z.infer<typeof reportSchema>;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/* ─── Design tokens ──────────────────────────────────────── */
const baseInput =
  'w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/30 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all duration-150 appearance-none';

const statusColors: Record<string, string> = {
  draft:     'bg-amber-500/10 text-amber-500 border-amber-500/20',
  published: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

/* ─── Field wrapper ──────────────────────────────────────── */
function Field({
  label, icon: Icon, error, children, className = '', hint,
}: {
  label: string;
  icon?: React.ElementType;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-widest select-none">
        {Icon && <Icon className="w-3 h-3 shrink-0 opacity-70" />}
        {label}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-xs text-red-400 font-medium mt-0.5"
        >
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </motion.p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-text-secondary/50">{hint}</p>
      )}
    </div>
  );
}

/* ─── Select ─────────────────────────────────────────────── */
function SelectField({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${baseInput} pr-9 cursor-pointer ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary/40" />
    </div>
  );
}

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${statusColors[status] ?? 'bg-border/40 text-text-secondary border-border'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* ─── Tab button ─────────────────────────────────────────── */
function Tab({
  label, icon: Icon, active, onClick, count,
}: {
  label: string; icon: React.ElementType; active: boolean; onClick: () => void; count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3.5 text-xs sm:text-[13px] font-semibold tracking-wide transition-all duration-150 focus-visible:outline-none ${
        active
          ? 'text-accent'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg/50'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none min-w-[1.2rem] text-center ${
          active ? 'bg-accent text-white' : 'bg-border/60 text-text-secondary'
        }`}>
          {count}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-x-0 bottom-0 h-[2px] bg-accent rounded-t-full"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
    </button>
  );
}

/* ─── Section drag row ───────────────────────────────────── */
function SectionRow({
  section, reportId, dragHandleProps, index,
}: {
  section: any; reportId: string; dragHandleProps: any; index: number;
}) {
  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden transition-all duration-150 hover:border-accent/30 hover:shadow-sm hover:shadow-accent/5">
      {/* Drag handle bar */}
      <div className="flex items-stretch">
        <div
          {...dragHandleProps}
          className="flex items-center justify-center w-8 shrink-0 border-r border-border/60 bg-bg/50 cursor-grab active:cursor-grabbing text-text-secondary/30 hover:text-text-secondary/70 hover:bg-bg transition-colors"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <SectionManager
            section={section}
            reportId={reportId}
            dragHandleProps={undefined}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ReportEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { activeReport, setActiveReport, addSection, updateReportField } = useReportStore();
  const [isSaving, setIsSaving]                     = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [activeTab, setActiveTab]                   = useState<'content' | 'coverPage'>('content');
  const [newSectionName, setNewSectionName]         = useState('');
  const [newSectionTitle, setNewSectionTitle]       = useState('');
  const [formExpanded, setFormExpanded]             = useState(true);
  const [isDirty, setIsDirty]                       = useState(false);

  const { data: clients }          = useClients();
  const { data: employees }        = useEmployees();
  const { data: projectsResponse } = useProjects({ page: 1, limit: 1000 });
  const projects                   = (projectsResponse as any)?.projects || [];

  const { data: initialReport, isLoading } = useReport(id!, { enabled: !isNew });

  const createMutation        = useCreateReport();
  const updateMutation        = useUpdateReport();
  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '', projectId: '', clientId: '',
      month: new Date().toLocaleString('default', { month: 'long' }),
      date: new Date().toISOString().split('T')[0],
      time: '', status: 'draft', assignedTo: '',
    },
  });

  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
      reset({
        title:      initialReport.title,
        projectId:  typeof initialReport.projectId === 'object' ? initialReport.projectId?._id : (initialReport.projectId || ''),
        clientId:   typeof initialReport.clientId  === 'object' ? initialReport.clientId._id   : initialReport.clientId,
        month:      initialReport.month,
        date:       initialReport.date  || '',
        time:       initialReport.time  || '',
        status:     initialReport.status,
        assignedTo: (typeof initialReport.assignedTo === 'object' ? initialReport.assignedTo?._id : initialReport.assignedTo) || '',
      });
      if (window.innerWidth < 640) setFormExpanded(false);
    } else if (isNew) {
      setActiveReport({
        _id: 'new', title: '', projectId: '',
        clientId: { _id: '', name: '', email: '', role: '', clientId: '' } as any,
        month: new Date().toLocaleString('default', { month: 'long' }),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: [],
      });
    }
    return () => setActiveReport(null);
  }, [initialReport, isNew, reset, setActiveReport]);

  /* dirty tracking */
  useEffect(() => {
    const sub = watch(() => setIsDirty(true));
    return () => sub.unsubscribe();
  }, [watch]);

  /* ── Save ── */
  const onSubmit = async (data: ReportFormData) => {
    setIsSaving(true);
    try {
      if (isNew) {
        const result = await createMutation.mutateAsync(data);
        toast.success('Report created successfully');
        navigate(`/reports/${result._id}`, { replace: true });
      } else {
        await updateMutation.mutateAsync({ id: id!, data });
        toast.success('Changes saved');
        setIsDirty(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save report.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Sections ── */
  const handleAddSectionClick = () => {
    if (isNew) { toast.error('Save the report before adding sections.'); return; }
    setNewSectionName(''); setNewSectionTitle('');
    setIsSectionModalOpen(true);
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      const s = await createSectionMutation.mutateAsync({
        reportId: id!,
        data: { name: newSectionName, title: newSectionTitle, type: 'standard', order: activeReport?.sections?.length || 0 },
      });
      addSection({ ...s, tables: [] });
      setIsSectionModalOpen(false);
      toast.success('Section created');
    } catch { toast.error('Failed to create section'); }
  };

  /* ── Cover pages ── */
  const resolveCoverPages = () => {
    let pages = activeReport?.coverPages || [];
    if (pages.length === 0 && (activeReport as any)?.coverPage)
      pages = [(activeReport as any).coverPage];
    return pages;
  };

  const saveCoverPages = async (newPages: any[]) => {
    const updated = await updateMutation.mutateAsync({
      id: activeReport!._id,
      data: { coverPages: newPages, coverPage: null as any },
    });
    updateReportField('coverPages', updated.coverPages);
    updateReportField('coverPage' as any, null);
  };

  const handleSaveCoverPageAtIndex = async (index: number, content: string, image: string) => {
    const pages = resolveCoverPages();
    const next  = [...pages];
    while (next.length <= index) next.push({ content: '', image: '' });
    next[index] = { content, image };
    try { await saveCoverPages(next); toast.success('Cover page saved'); }
    catch (e) { toast.error('Failed to save cover page'); throw e; }
  };

  const handleAddCoverPage    = async () => {
    try { await saveCoverPages([...resolveCoverPages(), { content: '', image: '' }]); toast.success('Cover page added'); }
    catch { toast.error('Failed to add cover page'); }
  };

  const handleCopyCoverPage   = async (index: number) => {
    const pages = resolveCoverPages();
    const next  = [...pages];
    next.splice(index + 1, 0, { ...pages[index], _id: undefined });
    try { await saveCoverPages(next); toast.success('Cover page duplicated'); }
    catch { toast.error('Failed to copy cover page'); }
  };

  const handleRemoveCoverPage = async (index: number) => {
    if (!activeReport?.coverPages || activeReport.coverPages.length <= 1) {
      toast.error('Cannot remove the last cover page.'); return;
    }
    const next = activeReport.coverPages.filter((_, i) => i !== index);
    try {
      const updated = await updateMutation.mutateAsync({ id: activeReport._id, data: { coverPages: next } });
      updateReportField('coverPages', updated.coverPages);
      toast.success('Cover page removed');
    } catch { toast.error('Failed to remove cover page'); }
  };

  /* ── Drag reorder ── */
  const onSectionDragEnd = async (result: DropResult) => {
    if (!result.destination || !activeReport?.sections) return;
    const items   = Array.from(activeReport.sections);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const updated = items.map((item, i) => ({ ...item, order: i }));
    useReportStore.getState().setSections(updated);
    try {
      for (const item of updated)
        await updateSectionMutation.mutateAsync({ sectionId: item._id!, data: { order: item.order } });
    } catch (e) { console.error('Failed to reorder sections', e); }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-text-secondary">
        <div className="relative w-10 h-10">
          <div className="w-10 h-10 border-2 border-border rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium">Loading report…</p>
      </div>
    );
  }

  const titleValue   = watch('title');
  const statusValue  = watch('status');
  const sectionCount = activeReport?.sections?.length ?? 0;
  const coverCount   = resolveCoverPages().length;

  return (
    <div className="space-y-4 sm:space-y-5 pb-28 max-w-6xl mx-auto">

      {/* ════════ TOP BAR ════════ */}
      <div className="sticky top-0 z-30 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="bg-bg/80 backdrop-blur-md border-b border-border sm:border-none sm:bg-transparent sm:backdrop-blur-none py-3 sm:py-0">
          <div className="flex items-center justify-between gap-3">

            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate('/reports')}
                className="p-2 rounded-xl border border-border hover:bg-card hover:border-accent/40 transition-all duration-150 text-text-secondary hover:text-text-primary shrink-0 group"
                title="Back to reports"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
              </button>

              <div className="min-w-0 hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent/60">
                    {isNew ? 'New' : 'Edit'} Report
                  </span>
                  {!isNew && <StatusBadge status={statusValue} />}
                  {isDirty && !isNew && (
                    <span className="text-[10px] text-text-secondary/50 italic">Unsaved changes</span>
                  )}
                </div>
                <h1 className="text-lg font-bold text-text-primary leading-tight truncate flex items-center gap-2 mt-0.5">
                  <FileText className="w-4 h-4 text-accent shrink-0" />
                  <span className="truncate max-w-sm">{isNew ? 'Create Report' : (titleValue || 'Untitled Report')}</span>
                </h1>
              </div>

              {/* Mobile: compact title */}
              <div className="sm:hidden min-w-0">
                <p className="text-[10px] font-bold tracking-widest uppercase text-accent/60">
                  {isNew ? 'New' : 'Edit'}
                </p>
                <h1 className="text-sm font-bold text-text-primary truncate max-w-[9rem]">
                  {titleValue || 'Untitled Report'}
                </h1>
              </div>
            </div>

            {/* Right */}
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 active:bg-accent/80 text-white text-sm font-semibold rounded-xl shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Saving…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{isNew ? 'Create Report' : 'Save Changes'}</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ════════ REPORT DETAILS ════════ */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-sm">

        {/* Collapsible header */}
        <button
          onClick={() => setFormExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-bg/40 transition-colors duration-150 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Report Details</p>
              {!formExpanded && titleValue && (
                <p className="text-xs text-text-secondary/60 truncate max-w-[12rem] sm:max-w-xs mt-0.5">
                  {titleValue}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!formExpanded && !isNew && <StatusBadge status={statusValue} />}
            <div className={`w-6 h-6 rounded-lg border border-border/60 flex items-center justify-center transition-transform duration-200 ${formExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary/60" />
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {formExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/50 px-4 sm:px-6 pt-5 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">

                  {/* Title — full width on mobile, 2 cols sm+ */}
                  <Field label="Report Title" icon={FileText} error={errors.title?.message} className="col-span-1 sm:col-span-2">
                    <input
                      {...register('title')}
                      className={baseInput}
                      placeholder="e.g., Q1 Media Coverage Report"
                    />
                  </Field>

                  <Field label="Project" icon={FolderOpen} error={errors.projectId?.message}>
                    <SelectField {...register('projectId')}>
                      <option value="">Select project…</option>
                      {(projects as any[]).map((p: any) => (
                        <option key={p._id} value={p._id}>{p.title}</option>
                      ))}
                    </SelectField>
                  </Field>

                  <Field label="Client" icon={User} error={errors.clientId?.message}>
                    <SelectField {...register('clientId')}>
                      <option value="">Select client…</option>
                      {(clients as any[])?.map((c: any) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </SelectField>
                  </Field>

                  <Field label="Month" icon={Calendar}>
                    <SelectField {...register('month')}>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </SelectField>
                  </Field>

                  {/* Date & Time — side by side on mobile too */}
                  <div className="col-span-1 sm:contents">
                    <div className="grid grid-cols-2 gap-3 sm:contents sm:grid-cols-none sm:gap-0">
                      <Field label="Date" icon={Calendar} className="sm:col-span-1">
                        <input type="date" {...register('date')} className={baseInput} />
                      </Field>
                      <Field label="Time" icon={Clock} className="sm:col-span-1">
                        <input type="time" {...register('time')} className={baseInput} />
                      </Field>
                    </div>
                  </div>

                  <Field label="Assign To" icon={User}>
                    <SelectField {...register('assignedTo')}>
                      <option value="">Unassigned</option>
                      {Array.isArray(employees) && (employees as any[]).map((e: any) => (
                        <option key={e._id} value={e._id}>{e.name}</option>
                      ))}
                    </SelectField>
                  </Field>

                  <Field label="Status" hint="Controls report visibility">
                    <SelectField {...register('status')}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </SelectField>
                  </Field>
                </div>

                {/* Save inside form — mobile only */}
                <div className="mt-5 sm:hidden">
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    {isSaving
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                      : <><Save className="w-4 h-4" />{isNew ? 'Create Report' : 'Save Changes'}</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════ NEW REPORT HINT ════════ */}
      <AnimatePresence>
        {isNew && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-accent/5 border border-accent/15"
          >
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Save to unlock sections & cover page</p>
              <p className="text-xs text-text-secondary/70 mt-0.5">Fill in the details above, then hit Save to continue building your report.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════ CONTENT + COVER TABS ════════ */}
      {!isNew && activeReport && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex border-b border-border bg-bg/30">
            <Tab label="Report Content" icon={Layers}        active={activeTab === 'content'}   onClick={() => setActiveTab('content')}   count={sectionCount} />
            <Tab label="Cover Page"     icon={LayoutTemplate} active={activeTab === 'coverPage'} onClick={() => setActiveTab('coverPage')} count={coverCount} />
            <div className="flex-1" /> {/* spacer */}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Content tab ── */}
            {activeTab === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="p-4 sm:p-6 space-y-4"
              >
                {/* Sub-header */}
                <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent/70" />
                      Sections
                    </h2>
                    <p className="text-xs text-text-secondary/50 mt-1">
                      {sectionCount === 0
                        ? 'No sections yet — add your first below'
                        : `${sectionCount} section${sectionCount !== 1 ? 's' : ''}${sectionCount > 1 ? ' · drag rows to reorder' : ''}`}
                    </p>
                  </div>
                  <button
                    onClick={handleAddSectionClick}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-xs sm:text-[13px] font-semibold rounded-xl shadow-md shadow-accent/20 hover:bg-accent/90 hover:shadow-accent/30 hover:-translate-y-px active:translate-y-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>

                {/* Empty state */}
                {sectionCount === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-16 flex flex-col items-center gap-3 text-text-secondary border-2 border-dashed border-border rounded-xl bg-bg/30"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-border/30 flex items-center justify-center">
                      <Layers className="w-6 h-6 opacity-40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-text-primary">No sections yet</p>
                      <p className="text-xs text-text-secondary/60 mt-1 max-w-[200px]">Sections organise your report into logical parts.</p>
                    </div>
                    <button
                      onClick={handleAddSectionClick}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add first section
                    </button>
                  </motion.div>
                ) : (
                  <DragDropContext onDragEnd={onSectionDragEnd}>
                    <Droppable droppableId="sections-list">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2.5"
                        >
                          {activeReport.sections?.map((section, index) => (
                            <Draggable key={section._id} draggableId={section._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`transition-all duration-150 ${
                                    snapshot.isDragging
                                      ? 'shadow-2xl shadow-black/20 ring-2 ring-accent/30 rotate-[0.3deg] scale-[1.01] z-50'
                                      : ''
                                  }`}
                                >
                                  <SectionRow
                                    section={section}
                                    reportId={activeReport._id}
                                    dragHandleProps={provided.dragHandleProps}
                                    index={index}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </motion.div>
            )}

            {/* ── Cover Page tab ── */}
            {activeTab === 'coverPage' && (
              <motion.div
                key="coverPage"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* Mobile landscape tip */}
                <div className="sm:hidden flex items-center gap-2.5 px-4 py-3 bg-accent/5 border-b border-border/60">
                  <Info className="w-3.5 h-3.5 text-accent shrink-0" />
                  <p className="text-xs text-text-secondary/70">
                    Rotate to landscape for a better editing experience.
                  </p>
                </div>

                <div className="p-3 sm:p-6">
                  <CustomPageEditor
                    pages={
                      activeReport.coverPages?.length
                        ? activeReport.coverPages
                        : (activeReport as any).coverPage
                          ? [{ content: (activeReport as any).coverPage.content, image: (activeReport as any).coverPage.image }]
                          : [{ content: '', image: '' }]
                    }
                    onSavePage={handleSaveCoverPageAtIndex}
                    onAddPage={handleAddCoverPage}
                    onCopyPage={handleCopyCoverPage}
                    onRemovePage={handleRemoveCoverPage}
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      )}

      {/* ════════ ADD SECTION MODAL ════════ */}
      <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="Add New Section">
        <div className="space-y-4">
          <Field label="Section Name" hint="Internal identifier (e.g. Print, TV, Online)">
            <input
              type="text"
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateSection()}
              className={baseInput}
              placeholder="e.g., Print Media"
              autoFocus
            />
          </Field>

          <Field label="Section Title" hint="Displayed in the PDF export">
            <input
              type="text"
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateSection()}
              className={baseInput}
              placeholder="e.g., Print Media Coverages"
            />
          </Field>

          {/* Divider */}
          <div className="border-t border-border/40 pt-1" />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              onClick={() => setIsSectionModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary border border-border hover:border-accent/30 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSection}
              disabled={!newSectionName.trim() || createSectionMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent/90 text-white rounded-xl transition-all duration-150 disabled:opacity-50 shadow-sm shadow-accent/20 hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {createSectionMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
              ) : (
                <><Plus className="w-4 h-4" />Create Section</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}