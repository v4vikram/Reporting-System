import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import CustomPageEditor from '../../../components/CustomPageEditor.tsx';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Save, ArrowLeft, Plus } from 'lucide-react';
import { reportService } from '../api/reportService.ts';
import { Report, Section } from '../types/index.ts';
import { useReportStore } from '../store/reportStore.ts';
import SectionManager from '../components/SectionManager.tsx';
import Modal from '../../../components/Modal.tsx';
import { useReport, useCreateReport, useUpdateReport, useCreateSection, useUpdateSection } from '../../../hooks/useReports.ts';
import { useClients, useEmployees } from '../../../hooks/useUsers.ts';

const reportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().min(1, 'Client is required'),
  month: z.string().min(1, 'Month is required'),
  date: z.string().optional(),
  time: z.string().optional(),
  status: z.enum(['draft', 'published']),
  assignedTo: z.string().optional()
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const { activeReport, setActiveReport, addSection, updateReportField } = useReportStore();
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'coverPage'>('content');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Fetch clients and employees for dropdowns
  const { data: clients } = useClients();
  const { data: employees } = useEmployees();

  const { data: initialReport, isLoading } = useReport(id!, { enabled: !isNew });

  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();
  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: '',
      clientId: '',
      month: new Date().toLocaleString('default', { month: 'long' }),
      date: new Date().toISOString().split('T')[0],
      time: '',
      status: 'draft',
      assignedTo: ''
    }
  });

  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
      reset({
        title: initialReport.title,
        clientId: typeof initialReport.clientId === 'object' ? initialReport.clientId._id : initialReport.clientId,
        month: initialReport.month,
        date: initialReport.date || '',
        time: initialReport.time || '',
        status: initialReport.status,
        assignedTo: (typeof initialReport.assignedTo === 'object' ? initialReport.assignedTo?._id : initialReport.assignedTo) || ''
      });
    } else if (isNew) {
      setActiveReport({
        _id: 'new',
        title: '',
        clientId: { _id: '', name: '', email: '', role: '', clientId: '' } as any, // Temporary mock user
        month: new Date().toLocaleString('default', { month: 'long' }),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sections: []
      });
    }
    return () => setActiveReport(null);
  }, [initialReport, isNew, reset, setActiveReport]);

  const onSubmit = async (data: ReportFormData) => {
    setIsSaving(true);
    try {
      if (isNew) {
        const result = await createMutation.mutateAsync(data);
        toast.success("Report created");
        navigate(`/reports/${result._id}`, { replace: true });
      } else {
        await updateMutation.mutateAsync({ id: id!, data });
        toast.success("Report saved");
      }
    } catch (error) {
       console.error("Failed to save report.", error);
       toast.error("Failed to save report.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSectionClick = () => {
    if (isNew) {
      toast.error('Please save the report first before adding sections.');
      return;
    }
    setNewSectionName('');
    setNewSectionTitle('');
    setIsSectionModalOpen(true);
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;

    try {
      const newSection = await createSectionMutation.mutateAsync({ 
        reportId: id!, 
        data: {
          name: newSectionName, 
          title: newSectionTitle,
          type: 'standard',
          order: activeReport?.sections?.length || 0 
        }
      });
      addSection({ ...newSection, tables: [] });
      setIsSectionModalOpen(false);
      toast.success('Section created');
    } catch (error) {
      console.error('Failed to create section', error);
      toast.error('Failed to create section');
    }
  };

  const handleSaveCoverPageAtIndex = async (index: number, content: string, image: string) => {
    if (!activeReport) return;
    let currentPages = activeReport.coverPages || [];
    
    // Migration check
    if (currentPages.length === 0 && (activeReport as any).coverPage) {
      currentPages = [(activeReport as any).coverPage];
    }
    
    const newPages = [...currentPages];
    
    // Ensure the array is long enough (in case it was empty)
    while (newPages.length <= index) {
      newPages.push({ content: '', image: '' });
    }
    
    newPages[index] = { content, image };
    
    try {
      const updatedReport = await updateMutation.mutateAsync({ 
         id: activeReport._id, 
         data: {
            coverPages: newPages,
            // Clear the old field if we're migrating
            coverPage: null as any
         }
      });
      updateReportField('coverPages', updatedReport.coverPages);
      // Also update locally to reflect the clear
      updateReportField('coverPage' as any, null);
      toast.success('Cover page saved');
    } catch (error) {
      console.error('Failed to save cover page', error);
      toast.error('Failed to save cover page');
      throw error; 
    }
  };

  const handleAddCoverPage = async () => {
    if (!activeReport) return;
    let currentPages = activeReport.coverPages || [];
    
    // Migration check
    if (currentPages.length === 0 && (activeReport as any).coverPage) {
      currentPages = [(activeReport as any).coverPage];
    }
    
    const newPages = [...currentPages, { content: '', image: '' }];
    try {
      const updatedReport = await updateMutation.mutateAsync({ id: activeReport._id, data: { 
        coverPages: newPages,
        coverPage: null as any
      }});
      updateReportField('coverPages', updatedReport.coverPages);
      updateReportField('coverPage' as any, null);
      toast.success('Cover page added');
    } catch (error) {
      toast.error('Failed to add cover page');
    }
  };

  const handleCopyCoverPage = async (index: number) => {
    if (!activeReport) return;
    let currentPages = activeReport.coverPages || [];
    
    // Migration check
    if (currentPages.length === 0 && (activeReport as any).coverPage) {
       currentPages = [(activeReport as any).coverPage];
    }
    
    const pageToCopy = currentPages[index];
    const newPages = [...currentPages];
    newPages.splice(index + 1, 0, { ...pageToCopy, _id: undefined }); // Don't copy _id
    try {
      const updatedReport = await updateMutation.mutateAsync({ id: activeReport._id, data: { 
        coverPages: newPages,
        coverPage: null as any
      }});
      updateReportField('coverPages', updatedReport.coverPages);
      updateReportField('coverPage' as any, null);
      toast.success('Cover page duplicated');
    } catch (error) {
      toast.error('Failed to copy cover page');
    }
  };

  const handleRemoveCoverPage = async (index: number) => {
    if (!activeReport || !activeReport.coverPages) return;
    if (activeReport.coverPages.length <= 1) {
      toast.error('Cannot remove the last cover page.');
      return;
    }
    const newPages = activeReport.coverPages.filter((_, i) => i !== index);
    try {
      const updatedReport = await updateMutation.mutateAsync({ id: activeReport._id, data: { coverPages: newPages } });
      updateReportField('coverPages', updatedReport.coverPages);
      toast.success('Cover page removed');
    } catch (error) {
      toast.error('Failed to remove cover page');
    }
  };

  const onSectionDragEnd = async (result: DropResult) => {
    if (!result.destination || !activeReport?.sections) return;

    const items = Array.from(activeReport.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update orders locally
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    useReportStore.getState().setSections(updatedItems);

    try {
      // Bulk update orders in backend (we'll do it sequentially if no bulk endpoint)
      for (const item of updatedItems) {
        await updateSectionMutation.mutateAsync({ sectionId: item._id!, data: { order: item.order }});
      }
    } catch (error) {
      console.error('Failed to reorder sections', error);
      // Revert if needed, but Zustand state is usually enough feedback
    }
  };

  if (isLoading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/reports')}
            className="p-2 hover:bg-border rounded-full transition-colors text-text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-text-primary">
            {isNew ? 'Create Report' : 'Edit Report'}
          </h1>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Report'}
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-1">Report Title</label>
            <input
              {...register('title')}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
              placeholder="e.g., Q1 Media Coverage"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Client</label>
            <select
              {...register('clientId')}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Select Client</option>
              {(clients as any[])?.map((client: any) => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Month</label>
            <select
              {...register('month')}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
            <input
              type="date"
              {...register('date')}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Time</label>
            <input
              type="time"
              {...register('time')}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Assign To</label>
            <select
              {...register('assignedTo')}
              value={watch('assignedTo')}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Unassigned</option>
              {Array.isArray(employees) && (employees as any[]).map((employee: any) => (
                <option key={employee._id} value={employee._id}>{employee.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </form>
      </div>

      {!isNew && activeReport && (
        <div className="space-y-6">
          <div className="flex gap-4 border-b border-border mb-6">
            <button 
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 font-medium transition-colors ${activeTab === 'content' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Report Content
            </button>
            <button 
              onClick={() => setActiveTab('coverPage')}
              className={`px-4 py-2 font-medium transition-colors ${activeTab === 'coverPage' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Cover Page
            </button>
          </div>

          {activeTab === 'content' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Sections</h2>
                <button
                  onClick={handleAddSectionClick}
                  className="flex items-center gap-2 px-3 py-1.5 bg-border text-text-primary rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>

              {activeReport?.sections?.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-lg text-text-secondary">
                  No sections added yet. Click "Add Section" to begin.
                </div>
              ) : (
                <DragDropContext onDragEnd={onSectionDragEnd}>
                  <Droppable droppableId="sections-list">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {activeReport?.sections?.map((section, index) => (
                          <Draggable key={section._id} draggableId={section._id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <SectionManager 
                                  section={section} 
                                  reportId={activeReport._id} 
                                  dragHandleProps={provided.dragHandleProps}
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
            </div>
          ) : (
            <div className="h-full">
               <CustomPageEditor 
                 pages={activeReport.coverPages && activeReport.coverPages.length > 0 
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
          )}
        </div>
      )}

      {/* Add Section Modal */}
      <Modal 
        isOpen={isSectionModalOpen} 
        onClose={() => setIsSectionModalOpen(false)}
        title="Add New Section"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Section Name (Internal)</label>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
              placeholder="e.g., Print, TV, Online"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Section Title (For PDF Page)</label>
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
              placeholder="e.g., Print Media Coverages"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsSectionModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateSection}
              disabled={!newSectionName.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Add Section
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
