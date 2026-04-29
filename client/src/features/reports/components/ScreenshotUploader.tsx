import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Upload, X, GripVertical } from 'lucide-react';
import { reportService } from '../api/reportService.ts';
import { CoverageTable } from '../types/index.ts';
import { useReportStore } from '../store/reportStore.ts';
import { getImageUrl } from '../../../lib/imageUtils.ts';
import Modal from '../../../components/Modal.tsx';

interface Props {
  table: CoverageTable;
  sectionId: string;
}

export default function ScreenshotUploader({ table, sectionId }: Props) {
  const { updateTableData } = useReportStore();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    try {
      const updatedTable = await reportService.uploadScreenshots(table._id, acceptedFiles);
      updateTableData(sectionId, updatedTable);
      toast.success('Screenshots uploaded successfully');
    } catch (error) {
      console.error('Failed to upload screenshots', error);
      toast.error('Failed to upload screenshots');
    } finally {
      setIsUploading(false);
    }
  }, [table._id, sectionId, updateTableData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] }
  } as any);

  const handleDelete = async (screenshotId: string) => {
    // Optimistic update
    const updatedScreenshots = table.screenshots.filter(s => s._id !== screenshotId);
    updateTableData(sectionId, { ...table, screenshots: updatedScreenshots });
    
    try {
      // We need an endpoint to delete a screenshot, or we can update the table
      await reportService.updateTable(table._id, { screenshots: updatedScreenshots });
      toast.success('Screenshot deleted');
    } catch (error) {
      console.error('Failed to delete screenshot', error);
      toast.error('Failed to delete screenshot');
      // Revert on failure
      updateTableData(sectionId, table);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(table.screenshots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update orders
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));

    // Optimistic update
    updateTableData(sectionId, { ...table, screenshots: updatedItems });

    try {
      await reportService.updateTable(table._id, { screenshots: updatedItems });
    } catch (error) {
      console.error('Failed to reorder screenshots', error);
      updateTableData(sectionId, table); // Revert
    }
  };

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-text-secondary bg-bg'}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto text-text-secondary mb-2" />
        {isUploading ? (
          <p className="text-sm text-text-secondary">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-sm text-accent">Drop the files here ...</p>
        ) : (
          <p className="text-sm text-text-secondary">Drag 'n' drop some images here, or click to select files</p>
        )}
      </div>

      {table.screenshots && table.screenshots.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={`screenshots-${table._id}`} direction="horizontal">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-wrap gap-4 mt-4"
              >
                {table.screenshots.map((screenshot, index) => (
                  // @ts-ignore
                  <Draggable key={screenshot._id} draggableId={screenshot._id!} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative group w-32 h-32 rounded-lg border border-border overflow-hidden bg-bg"
                      >
                        <div 
                          {...provided.dragHandleProps}
                          className="absolute top-1 left-1 p-1 bg-black/50 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-move"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <button
                          onClick={() => handleDelete(screenshot._id!)}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <img 
                          src={getImageUrl(screenshot.url)} 
                          alt={screenshot.caption || 'Screenshot'} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
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
  );
}
