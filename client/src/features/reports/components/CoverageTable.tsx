import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Copy, GripVertical, Image as ImageIcon, Upload, X as CloseIcon, Star, Sparkles, Loader2, WrapText } from 'lucide-react';
import { reportService } from '../api/reportService.ts';
import { geminiService } from '../api/geminiService.ts';
import { CoverageTable, Row } from '../types/index.ts';
import { useReportStore } from '../store/reportStore.ts';
import { getImageUrl } from '../../../lib/imageUtils.ts';
import ScreenshotUploader from './ScreenshotUploader.tsx';
import Modal from '../../../components/Modal.tsx';

const AutoResizingTextarea = ({ value, onChange, placeholder, className, title }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, className]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      title={title}
      className={`${className} overflow-hidden resize-none leading-relaxed min-h-[42px]`}
      rows={1}
    />
  );
};

interface Props {
  key?: React.Key;
  table: CoverageTable;
  sectionId: string;
  dragHandleProps?: any;
}

export default function CoverageTableComponent({ table, sectionId, dragHandleProps }: Props) {
  const { deleteTable, updateTableData, addTable, updateTable } = useReportStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [wrappedColumns, setWrappedColumns] = useState<Record<string, boolean>>({});

  const toggleWrap = (column: string) => {
    setWrappedColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };
  
  const extractInputRef = useRef<HTMLInputElement>(null);

  const handleExtractFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const extractedRows = await geminiService.extractTableFromImage(file);
      
      let updatedTable = { ...table };
      
      for (const rowData of extractedRows) {
        const newRow: Partial<Row> = {
          ...rowData,
          srNo: updatedTable.rows.length + 1,
          isTopCoverage: false,
          image: ''
        };
        updatedTable = await reportService.addRow(table._id, newRow);
      }
      
      updateTableData(sectionId, updatedTable);
      toast.success('Table extracted successfully');
      
    } catch (error: any) {
      console.error('Failed to extract table from image', error);
      toast.error(error.response?.data?.message || 'Failed to extract table from image. Ensure the image is clear.');
    } finally {
      setIsExtracting(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteTable = async () => {
    try {
      await reportService.deleteTable(table._id);
      deleteTable(sectionId, table._id);
      setIsDeleteModalOpen(false);
      toast.success('Table deleted');
    } catch (error) {
      console.error('Failed to delete table', error);
      toast.error('Failed to delete table');
      setIsDeleteModalOpen(false);
    }
  };

  const handleDuplicateTable = async () => {
    try {
      const newTable = await reportService.createTable(sectionId, {
        title: table.title ? `${table.title} (Copy)` : 'Copy',
        order: table.order + 1,
        screenshots: table.screenshots.map(s => ({ url: s.url, caption: s.caption, order: s.order }))
      });
      
      // Copy rows (sequentially to avoid race conditions if many)
      let updatedTable = newTable;
      for (const row of table.rows) {
        const { _id, ...rowData } = row;
        updatedTable = await reportService.addRow(newTable._id, rowData);
      }
      
      addTable(sectionId, updatedTable);
      toast.success('Table duplicated');
    } catch (error) {
      console.error('Failed to duplicate table', error);
      toast.error('Failed to duplicate table');
    }
  };

  const handleAddRow = async () => {
    try {
      const newRow: Partial<Row> = {
        srNo: table.rows.length + 1,
        headline: '',
        publication: '',
        edition: '',
        pageNo: '',
        date: new Date().toISOString().split('T')[0],
        link: '',
        image: '',
        isTopCoverage: false
      };
      const updatedTable = await reportService.addRow(table._id, newRow);
      updateTableData(sectionId, updatedTable);
      toast.success('Row added');
    } catch (error) {
      console.error('Failed to add row', error);
      toast.error('Failed to add row');
    }
  };

  const handleDuplicateRow = async (row: Row) => {
    try {
      const { _id, ...rowData } = row;
      // Find the highest srNo in the current rows
      const maxSrNo = table.rows.reduce((max, r) => Math.max(max, r.srNo || 0), 0);
      
      const updatedTable = await reportService.addRow(table._id, {
        ...rowData,
        srNo: maxSrNo + 1
      });
      updateTableData(sectionId, updatedTable);
      toast.success('Row duplicated');
    } catch (error) {
      console.error('Failed to duplicate row', error);
      toast.error('Failed to duplicate row');
    }
  };

  const handleRenumberRows = async () => {
    try {
      // Create a copy of the rows and update their srNo sequentially
      const updatedRows = table.rows.map((row, index) => ({
        ...row,
        srNo: index + 1
      }));

      // Update locally first for immediate feedback
      updateTableData(sectionId, { ...table, rows: updatedRows });

      // Save to backend - we need to update each row
      // To be efficient, we'd want a bulk update endpoint, but let's do it sequentially for now
      for (const row of updatedRows) {
        await reportService.updateRow(table._id, row._id!, { srNo: row.srNo });
      }
      toast.success('Rows renumbered');
    } catch (error) {
      console.error('Failed to renumber rows', error);
      toast.error('Failed to renumber serial numbers. Some rows might not have updated.');
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    try {
      const updatedTable = await reportService.deleteRow(table._id, rowId);
      updateTableData(sectionId, updatedTable);
      toast.success('Row deleted');
    } catch (error) {
      console.error('Failed to delete row', error);
      toast.error('Failed to delete row');
    }
  };

  const handleRowChange = async (rowId: string, field: keyof Row, value: any) => {
    // Optimistic update locally
    const updatedRows = table.rows.map(r => r._id === rowId ? { ...r, [field]: value } : r);
    updateTableData(sectionId, { ...table, rows: updatedRows });

    // Debounced save to backend would be better here, but for simplicity we'll save immediately
    // In a real prod app, use a debounced function or a "Save" button for the table
    try {
      await reportService.updateRow(table._id, rowId, { [field]: value });
    } catch (error) {
      console.error('Failed to update row', error);
      toast.error('Failed to update row');
      // Revert on failure could be implemented here
    }
  };

  const handleToggleColumn = async (column: string) => {
    const currentHidden = table.hiddenColumns || [];
    const newHidden = currentHidden.includes(column)
      ? currentHidden.filter(c => c !== column)
      : [...currentHidden, column];
      
    updateTableData(sectionId, { ...table, hiddenColumns: newHidden });
    
    try {
      await reportService.updateTable(table._id, { hiddenColumns: newHidden });
    } catch (error) {
      console.error('Failed to update column visibility', error);
      updateTableData(sectionId, { ...table, hiddenColumns: currentHidden });
    }
  };

  const toggleAllColumns = async () => {
    const allColumns = ['srNo', 'headline', 'publication', 'edition', 'pageNo', 'date', 'link', 'image'];
    const currentHidden = table.hiddenColumns || [];
    
    // If all are currently visible, hide all except maybe Sr No
    // If some are hidden, show all
    const allVisible = allColumns.every(col => !currentHidden.includes(col));
    const newHidden = allVisible ? allColumns.filter(c => c !== 'srNo') : [];
    
    updateTableData(sectionId, { ...table, hiddenColumns: newHidden });
    try {
      await reportService.updateTable(table._id, { hiddenColumns: newHidden });
    } catch (error) {
      console.error('Failed to update all columns visibility', error);
      updateTableData(sectionId, { ...table, hiddenColumns: currentHidden });
    }
  };

  const isVisible = (column: string) => !(table.hiddenColumns || []).includes(column);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const handleImageClick = (rowId: string) => {
    setActiveRowId(rowId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRowId) return;

    try {
      const updatedTable = await reportService.uploadRowImage(table._id, activeRowId, file);
      updateTableData(sectionId, updatedTable);
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Failed to upload row image', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setActiveRowId(null);
      e.target.value = '';
    }
  };

  const removeRowImage = async (rowId: string) => {
    try {
      const updatedTable = await reportService.updateRow(table._id, rowId, { image: '' });
      updateTableData(sectionId, updatedTable);
    } catch (error) {
      console.error('Failed to remove row image', error);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTableSectionElement>) => {
    // If target is an input/textarea, let the default browser behavior handle it.
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const clipboardData = e.clipboardData.getData('Text');
    if (!clipboardData) return;

    e.preventDefault();

    const rows = clipboardData.split('\n').filter(row => row.trim() !== '');
    
    let updatedTable = table;
    for (const row of rows) {
      const columns = row.split('\t');
      if (columns.length >= 1) {
        const newRow: Partial<Row> = {
          srNo: updatedTable.rows.length + 1,
          headline: columns[0] || '',
          publication: columns[1] || '',
          edition: columns[2] || '',
          pageNo: columns[3] || '',
          date: columns[4] ? new Date(columns[4]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          link: columns[5] || '',
          image: columns[6] || '',
          isTopCoverage: false
        };
        try {
          updatedTable = await reportService.addRow(table._id, newRow);
        } catch (error) {
          console.error('Failed to paste row', error);
        }
      }
    }
    updateTableData(sectionId, updatedTable);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div {...dragHandleProps} className="cursor-move p-1.5 hover:bg-border/60 rounded-md transition-colors">
            <GripVertical className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="flex flex-col gap-1">
            <input 
              type="text" 
              value={table.category || ''}
              onChange={(e) => {
                updateTable(sectionId, table._id, { category: e.target.value });
                reportService.updateTable(table._id, { category: e.target.value });
              }}
              className="text-lg font-bold text-text-primary bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-1 py-0.5 w-full"
              placeholder="TV"
            />
            <p className="text-[10px] text-text-secondary px-1">Category (e.g., TV, Online)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRenumberRows}
            className="text-[11px] font-semibold text-accent hover:bg-accent hover:text-white uppercase px-3 py-1.5 bg-accent/10 rounded-md border border-accent/20 transition-all active:scale-95"
            title="Auto-increment all SR NO sequentially (1, 2, 3...)"
          >
            Auto-Increment SR NO
          </button>
          <button 
            onClick={toggleAllColumns}
            className="text-[11px] font-semibold text-accent hover:bg-accent hover:text-white uppercase px-3 py-1.5 bg-accent/10 rounded-md border border-accent/20 transition-all active:scale-95"
            title="Toggle All Columns Visibility in PDF"
          >
            Check/Uncheck All
          </button>
          <button onClick={handleDuplicateTable} className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Duplicate Table">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Table">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm text-left border-separate border-spacing-0">
          <thead className="text-[11px] text-text-secondary font-bold uppercase tracking-wider bg-border/20">
            <tr>
              <th className="px-4 py-3 w-20 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('srNo')} onChange={() => handleToggleColumn('srNo')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  SR NO
                </div>
              </th>
              <th className="px-4 py-3 w-12 border-b border-border text-center">
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                  <span className="text-[9px] text-text-secondary font-bold">TOP</span>
                </div>
              </th>
              <th className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('headline')} onChange={() => handleToggleColumn('headline')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  HEADLINE
                  <button onClick={() => toggleWrap('headline')} className={`p-1 rounded transition-colors ${wrappedColumns['headline'] ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`} title="Toggle Word Wrap">
                    <WrapText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
              <th className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('publication')} onChange={() => handleToggleColumn('publication')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  PUBLICATION
                  <button onClick={() => toggleWrap('publication')} className={`p-1 rounded transition-colors ${wrappedColumns['publication'] ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`} title="Toggle Word Wrap">
                    <WrapText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
              <th className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('edition')} onChange={() => handleToggleColumn('edition')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  EDITION
                  <button onClick={() => toggleWrap('edition')} className={`p-1 rounded transition-colors ${wrappedColumns['edition'] ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`} title="Toggle Word Wrap">
                    <WrapText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
              <th className="px-4 py-3 w-28 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('pageNo')} onChange={() => handleToggleColumn('pageNo')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  PAGE NO
                </div>
              </th>
              <th className="px-4 py-3 w-40 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('date')} onChange={() => handleToggleColumn('date')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  DATE
                </div>
              </th>
              <th className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('link')} onChange={() => handleToggleColumn('link')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  LINK
                  <button onClick={() => toggleWrap('link')} className={`p-1 rounded transition-colors ${wrappedColumns['link'] ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'}`} title="Toggle Word Wrap">
                    <WrapText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </th>
              <th className="px-4 py-3 w-28 border-b border-border">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isVisible('image')} onChange={() => handleToggleColumn('image')} title="Show in PDF" className="w-3.5 h-3.5 cursor-pointer accent-accent" />
                  IMAGE
                </div>
              </th>
              <th className="px-4 py-3 w-32 min-w-[120px] border-b border-border"></th>
            </tr>
          </thead>
          <tbody onPaste={handlePaste}>
            {table.rows.map((row) => (
              <tr key={row._id} className="border-b border-border hover:bg-border/5 transition-colors group">
                <td className="px-3 py-2">
                  <input 
                    type="number" 
                    value={row.srNo} 
                    onChange={(e) => handleRowChange(row._id!, 'srNo', parseInt(e.target.value))}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button 
                    onClick={() => handleRowChange(row._id!, 'isTopCoverage', !row.isTopCoverage)}
                    className={`p-2 rounded-full transition-all ${row.isTopCoverage ? 'text-yellow-500 bg-yellow-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-border/50 opacity-0 group-hover:opacity-100'}`}
                    title={row.isTopCoverage ? 'Remove from Top Coverage' : 'Mark as Top Coverage'}
                  >
                    <Star className={`w-4 h-4 ${row.isTopCoverage ? 'fill-current' : ''}`} />
                  </button>
                </td>
                <td className="px-3 py-2">
                  {wrappedColumns['headline'] ? (
                    <AutoResizingTextarea 
                      value={row.headline} 
                      onChange={(e: any) => handleRowChange(row._id!, 'headline', e.target.value)}
                      className="w-full bg-transparent border-border focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary"
                      placeholder="Enter headline..."
                      title={row.headline}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={row.headline} 
                      onChange={(e) => handleRowChange(row._id!, 'headline', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary text-ellipsis"
                      placeholder="Enter headline..."
                      title={row.headline}
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {wrappedColumns['publication'] ? (
                    <AutoResizingTextarea 
                      value={row.publication} 
                      onChange={(e: any) => handleRowChange(row._id!, 'publication', e.target.value)}
                      className="w-full bg-transparent border-border focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary"
                      placeholder="Publication..."
                      title={row.publication}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={row.publication} 
                      onChange={(e) => handleRowChange(row._id!, 'publication', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary text-ellipsis"
                      placeholder="Publication..."
                      title={row.publication}
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {wrappedColumns['edition'] ? (
                    <AutoResizingTextarea 
                      value={row.edition} 
                      onChange={(e: any) => handleRowChange(row._id!, 'edition', e.target.value)}
                      className="w-full bg-transparent border-border focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary"
                      placeholder="Edition..."
                      title={row.edition}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={row.edition} 
                      onChange={(e) => handleRowChange(row._id!, 'edition', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary text-ellipsis"
                      placeholder="Edition..."
                      title={row.edition}
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="text" 
                    value={row.pageNo} 
                    onChange={(e) => handleRowChange(row._id!, 'pageNo', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary text-ellipsis"
                    placeholder="Page#"
                    title={row.pageNo}
                  />
                </td>
                <td className="px-3 py-2">
                  <input 
                    type="date" 
                    value={row.date ? new Date(row.date).toISOString().split('T')[0] : ''} 
                    onChange={(e) => handleRowChange(row._id!, 'date', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary [color-scheme:dark]"
                    title={row.date ? new Date(row.date).toISOString().split('T')[0] : ''}
                  />
                </td>
                <td className="px-3 py-2">
                  {wrappedColumns['link'] ? (
                    <AutoResizingTextarea 
                      value={row.link || ''} 
                      onChange={(e: any) => handleRowChange(row._id!, 'link', e.target.value)}
                      className="w-full bg-transparent border-border focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-blue-400 hover:text-blue-300 underline"
                      placeholder="https://..."
                      title={row.link}
                    />
                  ) : (
                    <input 
                      type="url" 
                      value={row.link || ''} 
                      onChange={(e) => handleRowChange(row._id!, 'link', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-accent rounded-md px-2 py-2 text-text-primary text-blue-400 hover:text-blue-300 underline text-ellipsis"
                      placeholder="https://..."
                      title={row.link}
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    {row.image ? (
                      <div className="relative group/img h-12 w-12 border border-border rounded-lg overflow-hidden shadow-sm">
                        <img 
                          src={getImageUrl(row.image)} 
                          alt="Row screenshot" 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                        <button 
                          onClick={() => removeRowImage(row._id!)}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleImageClick(row._id!)}
                        className="p-3 border border-dashed border-border rounded-lg hover:border-accent hover:text-accent transition-all bg-bg/50"
                        title="Upload Image"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-center w-32 min-w-[120px]">
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={() => handleDeleteRow(row._id!)} 
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/30 flex items-center justify-center shadow-sm" 
                      title="Delete Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDuplicateRow(row)} 
                      className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors border border-accent/30 flex items-center justify-center shadow-sm" 
                      title="Duplicate Row"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex items-center justify-between px-2">
          <button 
            onClick={handleAddRow}
            className="flex items-center gap-1 text-sm text-accent hover:text-blue-400 transition-colors py-1"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
          
          <button 
            onClick={() => extractInputRef.current?.click()}
            disabled={isExtracting}
            className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-accent to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all px-4 py-1.5 rounded-lg shadow-sm disabled:opacity-70"
          >
            {isExtracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isExtracting ? 'Analyzing Image...' : 'Auto-Fill from Image'}
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*" 
        />
        <input 
          type="file" 
          ref={extractInputRef} 
          onChange={handleExtractFromImage} 
          className="hidden" 
          accept="image/*" 
        />
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h5 className="text-sm font-medium text-text-secondary mb-3">Screenshots</h5>
        <ScreenshotUploader table={table} sectionId={sectionId} />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Table"
      >
        <div className="space-y-4">
          <p className="text-text-primary">Are you sure you want to delete this table? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteTable}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
