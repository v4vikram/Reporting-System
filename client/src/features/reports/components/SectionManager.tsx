import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, Copy, Layout, GripVertical, ChevronUp } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { reportService } from '../api/reportService.ts';
import { Section } from '../types/index.ts';
import { useReportStore } from '../store/reportStore.ts';
import CoverageTableComponent from './CoverageTable.tsx';
import CustomPageEditor from '../../../components/CustomPageEditor.tsx';
import Modal from '../../../components/Modal.tsx';

interface Props {
  section: Section;
  reportId: string;
  dragHandleProps?: any;
}

export default function SectionManager({ section, reportId, dragHandleProps }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { deleteSection, addTable, updateSection, updateTable, activeReport } = useReportStore();
  
  const handleMove = async (direction: 'up' | 'down') => {
    if (!activeReport?.sections) return;
    const items = [...activeReport.sections];
    const index = items.findIndex(s => s._id === section._id);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      [items[index-1], items[index]] = [items[index], items[index-1]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index+1], items[index]] = [items[index], items[index+1]];
    } else {
      return;
    }

    const updatedItems = items.map((item, idx) => ({ ...item, order: idx }));
    useReportStore.getState().setSections(updatedItems);

    try {
      for (const item of updatedItems) {
        await reportService.updateSection(item._id, { order: item.order });
      }
    } catch (error) {
      console.error('Failed to move section', error);
    }
  };
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSectionName, setEditSectionName] = useState(section.name);
  const [editSectionTitle, setEditSectionTitle] = useState(section.title || '');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableTitle, setNewTableTitle] = useState('');

  const handleDelete = async () => {
    try {
      await reportService.deleteSection(section._id);
      deleteSection(section._id);
      setIsDeleteModalOpen(false);
      toast.success('Section deleted');
    } catch (error) {
      console.error('Failed to delete section', error);
      toast.error('Failed to delete section');
      setIsDeleteModalOpen(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const updatedSections = await reportService.duplicateSection(reportId, section._id);
      useReportStore.getState().setSections(updatedSections);
      toast.success('Section duplicated');
    } catch (error) {
      console.error('Failed to duplicate section', error);
      toast.error('Failed to duplicate section');
    }
  };

  const handleAddTable = async () => {
    try {
      const newTable = await reportService.createTable(section._id, {
        title: newTableTitle || "New Table",
        order: section.tables?.length || 0,
        rows: [],
        screenshots: []
      });
      addTable(section._id, newTable);
      setIsTableModalOpen(false);
      toast.success('Table created');
    } catch (error) {
      console.error('Failed to create table', error);
      toast.error('Failed to create table');
    }
  };

  const handleEditSection = async () => {
    if (!editSectionName.trim()) return;

    try {
      const updatedSection = await reportService.updateSection(section._id, {
        name: editSectionName,
        title: editSectionTitle
      });
      updateSection(section._id, updatedSection);
      setIsEditModalOpen(false);
      toast.success('Section updated');
    } catch (error) {
      console.error('Failed to update section', error);
      toast.error('Failed to update section');
    }
  };

  const handleSaveCustomContent = async (content: string, image: string) => {
    try {
      const updatedSection = await reportService.updateSection(section._id, {
        content,
        image
      });
      updateSection(section._id, updatedSection);
      toast.success('Design saved');
    } catch (error) {
       console.error('Failed to save custom content', error);
       toast.error('Failed to save design');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !section.tables) return;

    const items = Array.from(section.tables);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update orders locally
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    updateSection(section._id, { tables: updatedItems });

    try {
      // Update backend for each moved table
      // In a real app, you'd want a bulk update endpoint, but we'll do it sequentially here
      for (const item of updatedItems) {
        await reportService.updateTable(item._id, { order: item.order });
      }
    } catch (error) {
      console.error('Failed to reorder tables', error);
      // Revert on failure
      updateSection(section._id, { tables: section.tables });
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-border/30 cursor-pointer hover:bg-border/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-bg/50 rounded" onClick={e => e.stopPropagation()}>
            <GripVertical className="w-4 h-4 text-text-secondary" />
          </div>
          {isExpanded ? <ChevronDown className="w-5 h-5 text-text-secondary" /> : <ChevronRight className="w-5 h-5 text-text-secondary" />}
          <div className="flex items-center gap-2">
            {section.type === 'custom' && <Layout className="w-4 h-4 text-accent" />}
            <h3 className="text-lg font-medium text-text-primary">{section.name}</h3>
          </div>
          <span className="text-xs text-text-secondary ml-2 bg-bg px-2 py-1 rounded-full">
            {section.type === 'custom' ? 'Custom Layout' : `${section.tables?.length || 0} tables`}
          </span>
        </div>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
             <button
               onClick={() => handleMove('up')}
               className="p-1 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
               title="Move Up"
             >
               <ChevronUp className="w-4 h-4" />
             </button>
             <button
               onClick={() => handleMove('down')}
               className="p-1 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
               title="Move Down"
             >
               <ChevronDown className="w-4 h-4" />
             </button>
          </div>
          <button
            onClick={handleDuplicate}
            className="p-1 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
            title="Duplicate Section"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditSectionName(section.name);
              setEditSectionTitle(section.title || '');
              setIsEditModalOpen(true);
            }}
            className="p-1 text-text-secondary hover:text-accent hover:bg-accent/10 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {section.type === 'standard' && (
            <button
              onClick={() => {
                setNewTableTitle('');
                setIsTableModalOpen(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-sm text-accent hover:bg-accent/10 rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </button>
          )}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-bg/50">
          {section.type === 'custom' ? (
            <CustomPageEditor 
              pages={[{ content: section.content || '', image: '' }]} 
              onSavePage={(_idx, content, image) => handleSaveCustomContent(content, image)}
              onAddPage={() => {}}
              onCopyPage={() => {}}
              onRemovePage={() => {}}
            />
          ) : section.tables?.length === 0 ? (
            <div className="text-center py-6 text-text-secondary text-sm">
              No tables in this section.
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId={`tables-${section._id}`}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                    {section.tables?.map((table, index) => (
                      // @ts-ignore - react-beautiful-dnd types issue with React 18
                      <Draggable key={table._id} draggableId={table._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <CoverageTableComponent 
                              table={table} 
                              sectionId={section._id} 
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
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Section"
      >
        <div className="space-y-4">
          <p className="text-text-primary">Are you sure you want to delete the "{section.name}" section? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Section Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Section"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Section Name (Internal)</label>
            <input
              type="text"
              value={editSectionName}
              onChange={(e) => setEditSectionName(e.target.value)}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
              placeholder="e.g., Print, TV, Online"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Section Title (For PDF Page)</label>
            <input
              type="text"
              value={editSectionTitle}
              onChange={(e) => setEditSectionTitle(e.target.value)}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
              placeholder="e.g., Print Media Coverages"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleEditSection}
              disabled={!editSectionName.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Table Modal */}
      <Modal 
        isOpen={isTableModalOpen} 
        onClose={() => setIsTableModalOpen(false)}
        title="Add New Table"
      >
        <div className="space-y-4">
          <p className="text-text-primary">Click below to add a new table to this section.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsTableModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddTable}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Table
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
