import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Circle, Line } from 'react-konva';
import { Type, Image as ImageIcon, Square, Trash2, Save, Circle as CircleIcon, Minus, Palette, MousePointer2, Undo2, Redo2, Plus, Copy, Search, Move, Bold, Italic, AlignCenter, Group, Ungroup, ChevronRight, MoreHorizontal, Layout } from 'lucide-react';
import useImage from 'use-image';
import { getImageUrl } from '../lib/imageUtils.ts';
import { ChromePicker } from 'react-color';
import Modal from './Modal.tsx';

interface Element {
  id: string;
  type: 'text' | 'image' | 'rect' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  src?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontWeight?: string;
  fontStyle?: string;
  groupId?: string;
}

interface CustomPageEditorProps {
  pages: { content: string; image: string; _id?: string }[];
  onSavePage: (index: number, content: string, image: string) => void;
  onAddPage: () => void;
  onCopyPage: (index: number) => void;
  onRemovePage: (index: number) => void;
}

const URLImage = ({ id, src, x, y, width, height, isSelected, onSelect, onChange }: any) => {
  const [img] = useImage(getImageUrl(src), 'anonymous', 'no-referrer');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([shapeRef.current]);
      trRef.current?.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        id={id}
        image={img}
        x={x}
        y={y}
        width={width}
        height={height}
        scaleX={1}
        scaleY={1}
        draggable
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} keepRatio={true} />}
    </>
  );
};

const TextComponent = ({ id, text, x, y, fontSize, fill, fontWeight, fontStyle, isSelected, onSelect, onDblClick, onChange }: any) => {
  const shapeRef = useRef<any>(null);

  return (
    <Text
      id={id}
      text={text}
      x={x}
      y={y}
      fontSize={fontSize}
      fill={fill || '#000000'}
      fontWeight={fontWeight || 'normal'}
      fontStyle={fontStyle || 'normal'}
      fontFamily="Inter, system-ui, sans-serif"
      scaleX={1}
      scaleY={1}
      draggable
      ref={shapeRef}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={() => {
         const node = shapeRef.current;
         const scaleX = node.scaleX();
         onChange({
           x: node.x(),
           y: node.y(),
           fontSize: node.fontSize() * scaleX
         });
      }}
    />
  );
};

const RectComponent = ({ id, x, y, width, height, fill, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>(null);

  return (
    <Rect
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill || '#3498db'}
      scaleX={1}
      scaleY={1}
      draggable
      ref={shapeRef}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        });
      }}
    />
  );
};

const CircleComponent = ({ id, x, y, radius, fill, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>(null);

  return (
    <Circle
      id={id}
      x={x}
      y={y}
      radius={radius}
      fill={fill || '#e74c3c'}
      scaleX={1}
      scaleY={1}
      draggable
      ref={shapeRef}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        onChange({
          x: node.x(),
          y: node.y(),
          radius: Math.max(5, node.radius() * scaleX),
        });
      }}
    />
  );
};

const LineComponent = ({ id, x, y, points, stroke, strokeWidth, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>(null);

  return (
    <Line
      id={id}
      x={x}
      y={y}
      points={points}
      stroke={stroke || '#2c3e50'}
      strokeWidth={strokeWidth || 2}
      scaleX={1}
      scaleY={1}
      draggable
      ref={shapeRef}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        onChange({
          x: node.x(),
          y: node.y(),
          points: node.points().map((p: number, i: number) => i % 2 === 0 ? p * scaleX : p * scaleY),
        });
      }}
    />
  );
};

export default function CustomPageEditor({ pages, onSavePage, onAddPage, onCopyPage, onRemovePage }: CustomPageEditorProps) {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [allElements, setAllElements] = useState<Element[][]>([]);
  const [history, setHistory] = useState<Element[][][]>([]);
  const [historyStep, setHistoryStep] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedElement, setCopiedElement] = useState<Element | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [activePopover, setActivePopover] = useState<'text' | 'align' | 'shapes' | null>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  // Initialize allElements from pages prop
  useEffect(() => {
    setAllElements(prev => {
      // Create a map for existing elements to preserve them
      const prevMap = new Map((prev || []).map((els, i) => [i, els]));
      const initialized = pages.map((p, i) => {
        if (prevMap.has(i)) return prevMap.get(i)!;
        try {
          return p.content ? JSON.parse(p.content) : [];
        } catch (e) {
          return [];
        }
      });
      return initialized;
    });

    setHistory(prev => {
      const prevMap = new Map((prev || []).map((h, i) => [i, h]));
      const next = pages.map((p, i) => {
        if (prevMap.has(i)) return prevMap.get(i)!;
        let initialElements = [];
        try {
          initialElements = p.content ? JSON.parse(p.content) : [];
        } catch (e) {}
        return [initialElements];
      });
      return next;
    });

    setHistoryStep(prev => {
      const prevMap = new Map((prev || []).map((s, i) => [i, s]));
      const next = pages.map((p, i) => {
        if (prevMap.has(i)) return prevMap.get(i)!;
        return 0;
      });
      return next;
    });
    
    // Auto-focus the last page if a new one was added
    setAllElements(currentAll => {
      if (pages.length > currentAll.length && currentAll.length > 0) {
        setActivePageIndex(pages.length - 1);
      }
      return currentAll;
    });
  }, [pages.length]);

  const elements = allElements[activePageIndex] || [];
  const currentHistory = history[activePageIndex] || [[]];
  const currentStep = historyStep[activePageIndex] || 0;

  // Modified pushToHistory for active page
  const pushToHistory = (newElements: Element[]) => {
    setAllElements(prev => {
      const next = [...prev];
      next[activePageIndex] = newElements;
      return next;
    });

    setHistory(prevHistory => {
      const nextHistory = [...prevHistory];
      setHistoryStep(prevSteps => {
        const nextSteps = [...prevSteps];
        const currentStepForPage = prevSteps[activePageIndex] || 0;
        const pageHistory = [...(prevHistory[activePageIndex] || [])].slice(0, currentStepForPage + 1);
        
        pageHistory.push(newElements);
        if (pageHistory.length > 50) pageHistory.shift();
        
        nextHistory[activePageIndex] = pageHistory;
        nextSteps[activePageIndex] = pageHistory.length - 1;
        return nextSteps;
      });
      return nextHistory;
    });
  };

  const undo = () => {
    setHistoryStep(prevSteps => {
      const currentStepForPage = prevSteps[activePageIndex] || 0;
      if (currentStepForPage > 0) {
        const nextStep = currentStepForPage - 1;
        const nextSteps = [...prevSteps];
        nextSteps[activePageIndex] = nextStep;

        setAllElements(prevAll => {
          const nextAll = [...prevAll];
          const pageHistory = history[activePageIndex];
          if (pageHistory && pageHistory[nextStep]) {
            nextAll[activePageIndex] = pageHistory[nextStep];
          }
          return nextAll;
        });

        return nextSteps;
      }
      return prevSteps;
    });
  };

  const redo = () => {
    setHistoryStep(prevSteps => {
      const currentStepForPage = prevSteps[activePageIndex] || 0;
      const pageHistory = history[activePageIndex] || [];
      if (currentStepForPage < pageHistory.length - 1) {
        const nextStep = currentStepForPage + 1;
        const nextSteps = [...prevSteps];
        nextSteps[activePageIndex] = nextStep;

        setAllElements(prevAll => {
          const nextAll = [...prevAll];
          if (pageHistory[nextStep]) {
            nextAll[activePageIndex] = pageHistory[nextStep];
          }
          return nextAll;
        });

        return nextSteps;
      }
      return prevSteps;
    });
  };

  // Text Editing states
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [editingText, setEditingText] = useState('');
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update transformer nodes when selection changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const nodes = selectedIds.map(id => stageRef.current.findOne('#' + id)).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, activePageIndex]);

  const moveSelected = (dx: number, dy: number) => {
    if (selectedIds.length === 0 && !selectedId) return;
    const targets = selectedIds.length > 0 ? selectedIds : [selectedId!];
    const newElements = elements.map(el => {
      if (targets.includes(el.id)) {
        return { ...el, x: (el.x || 0) + dx, y: (el.y || 0) + dy };
      }
      return el;
    });
    pushToHistory(newElements);
  };

  const copyElement = () => {
    const el = elements.find(el => el.id === (selectedIds[0] || selectedId));
    if (el) {
      setCopiedElement(JSON.parse(JSON.stringify(el)));
    }
  };

  const pasteElement = () => {
    if (copiedElement) {
      const newEl = {
        ...copiedElement,
        id: Math.random().toString(36).substr(2, 9),
        x: (copiedElement.x || 0) + 20,
        y: (copiedElement.y || 0) + 20
      };
      pushToHistory([...elements, newEl]);
      setSelectedId(newEl.id);
      setSelectedIds([newEl.id]);
    }
  };

  const duplicateSelected = () => {
    const targets = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (targets.length === 0) return;
    
    const newEls = targets.map(tid => {
      const el = elements.find(e => e.id === tid);
      if (!el) return null;
      return {
        ...el,
        id: Math.random().toString(36).substr(2, 9),
        x: (el.x || 0) + 20,
        y: (el.y || 0) + 20
      };
    }).filter(Boolean) as Element[];

    pushToHistory([...elements, ...newEls]);
    if (newEls.length > 0) {
      setSelectedId(newEls[0].id);
      setSelectedIds(newEls.map(ne => ne.id));
    }
  };

  const groupElements = () => {
    if (selectedIds.length < 2) return;
    const newGroupId = Math.random().toString(36).substr(2, 9);
    const newElements = elements.map(el => {
      if (selectedIds.includes(el.id)) {
        return { ...el, groupId: newGroupId };
      }
      return el;
    });
    pushToHistory(newElements);
  };

  const ungroupElements = () => {
    const targets = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (targets.length === 0) return;

    const groupIdsToUngroup = elements
        .filter(el => targets.includes(el.id) && el.groupId)
        .map(el => el.groupId!);
    
    if (groupIdsToUngroup.length === 0) return;

    const newElements = elements.map(el => {
      if (el.groupId && groupIdsToUngroup.includes(el.groupId)) {
        const { groupId, ...rest } = el;
        return rest;
      }
      return el;
    });
    pushToHistory(newElements);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        setIsSpacePressed(true);
        if (!e.repeat) e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 'c') {
          e.preventDefault();
          copyElement();
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteElement();
        } else if (e.key === 'd') {
          e.preventDefault();
          duplicateSelected();
        } else if (e.key === 'b') {
          e.preventDefault();
          toggleBold();
        } else if (e.key === 'i') {
          e.preventDefault();
          toggleItalic();
        }
      }
      
      // Ctrl + Shift + Z as another standard redo shortcut
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }

      // Group / Ungroup shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
            ungroupElements();
        } else {
            groupElements();
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !isTextModalOpen) {
          deleteSelected();
        }
      }

      // Arrow movement
      if (selectedId && !isTextModalOpen && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowUp') moveSelected(0, -step);
        if (e.key === 'ArrowDown') moveSelected(0, step);
        if (e.key === 'ArrowLeft') moveSelected(-step, 0);
        if (e.key === 'ArrowRight') moveSelected(step, 0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [historyStep, history, selectedId, isTextModalOpen, elements, copiedElement]);

  const handleWheel = (e: any) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY;
      const scaleBy = 1.1;
      const newZoom = delta > 0 ? zoom / scaleBy : zoom * scaleBy;
      setZoom(Math.min(Math.max(0.1, newZoom), 5));
    }
  };

  useEffect(() => {
    const container = document.getElementById('canvas-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [zoom]);

  const addText = () => {
    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: 50,
      y: 50,
      text: 'Double click to edit',
      fontSize: 24,
      fill: '#000000'
    };
    pushToHistory([...elements, newElement]);
  };

  const addRect = () => {
    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'rect',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      fill: '#3498db'
    };
    pushToHistory([...elements, newElement]);
  };

  const addCircle = () => {
    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'circle',
      x: 150,
      y: 150,
      radius: 50,
      fill: '#e74c3c'
    };
    pushToHistory([...elements, newElement]);
  };

  const addLine = () => {
    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'line',
      x: 100,
      y: 100,
      points: [0, 0, 100, 0],
      stroke: '#2c3e50',
      strokeWidth: 4
    };
    pushToHistory([...elements, newElement]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newElement: Element = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          src: event.target?.result as string
        };
        pushToHistory([...elements, newElement]);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteSelected = () => {
    const targets = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (targets.length > 0) {
      pushToHistory(elements.filter(el => !targets.includes(el.id)));
      setSelectedId(null);
      setSelectedIds([]);
    }
  };

  const updateSelectedColor = (color: string, pushHistory = false) => {
    if (selectedIds.length === 0 && !selectedId) return;
    const targets = selectedIds.length > 0 ? selectedIds : [selectedId!];
    const newElements = elements.map(el => {
      if (targets.includes(el.id)) {
        if (el.type === 'line') return { ...el, stroke: color };
        return { ...el, fill: color };
      }
      return el;
    });
    
    if (pushHistory) {
      pushToHistory(newElements);
    } else {
      const newAllElements = [...allElements];
      newAllElements[activePageIndex] = newElements;
      setAllElements(newAllElements);
    }
  };

  const handleTextEdit = () => {
    const el = elements.find(e => e.id === selectedId);
    if (el && el.type === 'text') {
      setEditingText(el.text || '');
      setIsTextModalOpen(true);
    }
  };

  const saveTextEdit = () => {
    pushToHistory(elements.map(el => el.id === selectedId ? { ...el, text: editingText } : el));
    setIsTextModalOpen(false);
  };

  const centerHorizontal = () => {
    if (!selectedId || !stageRef.current) return;
    const stageWidth = 595;
    const node = stageRef.current.findOne('#' + selectedId);
    if (!node) return;

    const rect = node.getClientRect();
    const currentCenterX = rect.x + rect.width / 2;
    const deltaX = (stageWidth / 2) - currentCenterX;

    const newElements = elements.map(el => {
      if (el.id === selectedId) {
        return { ...el, x: (el.x || 0) + deltaX };
      }
      return el;
    });
    pushToHistory(newElements);
  };

  const centerVertical = () => {
    if (!selectedId || !stageRef.current) return;
    const stageHeight = 842;
    const node = stageRef.current.findOne('#' + selectedId);
    if (!node) return;

    const rect = node.getClientRect();
    const currentCenterY = rect.y + rect.height / 2;
    const deltaY = (stageHeight / 2) - currentCenterY;

    const newElements = elements.map(el => {
      if (el.id === selectedId) {
        return { ...el, y: (el.y || 0) + deltaY };
      }
      return el;
    });
    pushToHistory(newElements);
  };

  const toggleBold = () => {
    if (!selectedId) return;
    const newElements = elements.map(el => {
      if (el.id === selectedId && el.type === 'text') {
        return { ...el, fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' };
      }
      return el;
    });
    pushToHistory(newElements);
  };

  const toggleItalic = () => {
    if (!selectedId) return;
    const newElements = elements.map(el => {
      if (el.id === selectedId && el.type === 'text') {
        return { ...el, fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' };
      }
      return el;
    });
    pushToHistory(newElements);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    if (stageRef.current) {
      setIsSaving(true);
      setSaveStatus('idle');
      setSelectedId(null);
      
      // small delay to ensure selection clear is rendered
      setTimeout(async () => {
        try {
          const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
          await onSavePage(activePageIndex, JSON.stringify(elements), dataURL);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e) {
          setSaveStatus('error');
        } finally {
          setIsSaving(false);
        }
      }, 100);
    }
  };

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const isRightClick = e.evt?.button === 2;

    if (clickedOnEmpty || isRightClick) {
      if (!e.evt?.shiftKey && !isRightClick) {
        setSelectedId(null);
        setSelectedIds([]);
      }
      setShowColorPicker(false);
      setActivePopover(null);

      // Start selection rectangle logic
      // Always allow if right click, or if clicked on empty with left click
      if (!isSpacePressed && (isRightClick || e.evt?.button === 0)) {
        const pos = e.target.getStage().getPointerPosition();
        if (pos) {
            setSelectionRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
        }
      }
    }
  };

  const handleMouseMove = (e: any) => {
      if (selectionRect) {
          const pos = e.target.getStage().getPointerPosition();
          setSelectionRect(prev => prev ? ({ ...prev, x2: pos.x, y2: pos.y }) : null);
      }
  };

  const handleMouseUp = (e: any) => {
      if (selectionRect) {
          const xmin = Math.min(selectionRect.x1, selectionRect.x2);
          const xmax = Math.max(selectionRect.x1, selectionRect.x2);
          const ymin = Math.min(selectionRect.y1, selectionRect.y2);
          const ymax = Math.max(selectionRect.y1, selectionRect.y2);

          const found = elements.filter(el => {
              // Simple check for x,y inside rect
              // In production we'd use getClientRect() but for this demo coordinates suffice
              return (el.x || 0) >= xmin && (el.x || 0) <= xmax && (el.y || 0) >= ymin && (el.y || 0) <= ymax;
          }).map(el => el.id);

          if (found.length > 0) {
              setSelectedIds(found);
              setSelectedId(found[0]);
          } else if (Math.abs(selectionRect.x1 - selectionRect.x2) > 5) {
              setSelectedIds([]);
              setSelectedId(null);
          }
          setSelectionRect(null);
      }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 h-auto relative bg-card/30 rounded-2xl border border-border">
      {/* Shared Sidebar */}
      <div className="flex flex-row lg:flex-col gap-2 p-2 bg-card/80 backdrop-blur-md rounded-xl border border-border h-fit sticky top-2 z-50 shadow-sm transition-all overflow-x-auto lg:overflow-x-visible">
        {/* Elements Group */}
        <div className="flex flex-row lg:flex-col gap-1 items-center">
          <button onClick={addText} className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 group" title="Add Text">
            <Type className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium">Text</span>
          </button>
          
          <div className="relative group/shapes">
            <button 
                onClick={() => setActivePopover(activePopover === 'shapes' ? null : 'shapes')}
                className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 group" 
                title="Shapes"
            >
              <Layout className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-medium">Shapes</span>
            </button>
            {activePopover === 'shapes' && (
                <div className="absolute left-full top-0 ml-3 z-50 bg-card border border-border rounded-xl shadow-2xl p-2 flex flex-col gap-1 min-w-[100px] animate-in fade-in slide-in-from-left-2 duration-200">
                    <button onClick={() => { addRect(); setActivePopover(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent text-xs font-medium">
                        <Square className="w-4 h-4" /> Rectangle
                    </button>
                    <button onClick={() => { addCircle(); setActivePopover(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent text-xs font-medium">
                        <CircleIcon className="w-4 h-4" /> Circle
                    </button>
                    <button onClick={() => { addLine(); setActivePopover(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent text-xs font-medium">
                        <Minus className="w-4 h-4" /> Line
                    </button>
                </div>
            )}
          </div>

          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 group" title="Add Image">
            <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-medium">Image</span>
          </button>
        </div>
        
        <div className="h-px bg-border my-1 hidden lg:block opacity-50" />
        
        {/* Modify Group */}
        <div className="flex flex-row lg:flex-col gap-1 items-center">
            <div className="relative group/color">
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)} 
                disabled={selectedIds.length === 0 && !selectedId}
                className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" 
                title="Change Color"
              >
                <Palette className="w-5 h-5 group-hover:rotate-12 transition-transform" style={{ color: selectedElement?.fill || selectedElement?.stroke || 'inherit' }} />
                <span className="text-[9px] font-medium">Color</span>
              </button>
              {showColorPicker && (
                <div className="absolute left-full top-0 ml-3 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                  <ChromePicker 
                    color={selectedElement?.fill || selectedElement?.stroke || '#000000'}
                    onChange={(color) => updateSelectedColor(color.hex)}
                    onChangeComplete={(color) => updateSelectedColor(color.hex, true)}
                  />
                </div>
              )}
            </div>

            {/* Typography Popover */}
            <div className="relative">
                <button 
                  onClick={() => setActivePopover(activePopover === 'text' ? null : 'text')} 
                  disabled={!selectedId || selectedElement?.type !== 'text'} 
                  className={`p-2.5 hover:bg-accent/10 rounded-lg transition-all flex flex-col items-center gap-1 disabled:opacity-30 group ${activePopover === 'text' ? 'text-accent bg-accent/5' : 'text-text-secondary'}`} 
                  title="Typography"
                >
                  <Type className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-medium">Format</span>
                </button>
                {activePopover === 'text' && (
                    <div className="absolute left-full top-0 ml-3 z-50 bg-card border border-border rounded-xl shadow-2xl p-3 flex flex-col gap-2 min-w-[150px] animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex gap-1 p-1 bg-bg rounded-lg border border-border">
                            <button onClick={toggleBold} className={`flex-1 p-2 rounded flex flex-col items-center gap-1 hover:bg-accent/10 transition-colors ${selectedElement?.fontWeight === 'bold' ? 'text-accent bg-accent/5' : 'text-text-secondary'}`} title="Bold">
                                <Bold className="w-4 h-4" />
                                <span className="text-[8px] font-bold">Bold</span>
                            </button>
                            <button onClick={toggleItalic} className={`flex-1 p-2 rounded flex flex-col items-center gap-1 hover:bg-accent/10 transition-colors ${selectedElement?.fontStyle === 'italic' ? 'text-accent bg-accent/5' : 'text-text-secondary'}`} title="Italic">
                                <Italic className="w-4 h-4" />
                                <span className="text-[8px] font-bold">Italic</span>
                            </button>
                        </div>
                        <button onClick={handleTextEdit} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent text-xs font-medium">
                            <MousePointer2 className="w-4 h-4" /> Edit Content
                        </button>
                    </div>
                )}
            </div>

            {/* Align Popover */}
            <div className="relative">
              <button 
                onClick={() => setActivePopover(activePopover === 'align' ? null : 'align')} 
                disabled={selectedIds.length === 0 && !selectedId} 
                className={`p-2.5 hover:bg-accent/10 rounded-lg transition-all flex flex-col items-center gap-1 disabled:opacity-30 group ${activePopover === 'align' ? 'text-accent bg-accent/5' : 'text-text-secondary'}`} 
                title="Alignment"
              >
                <AlignCenter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-medium">Align</span>
              </button>
              {activePopover === 'align' && (
                    <div className="absolute left-full top-0 ml-3 z-50 bg-card border border-border rounded-xl shadow-2xl p-2 flex flex-col gap-1 min-w-[140px] animate-in fade-in slide-in-from-left-2 duration-200">
                        <button onClick={() => { centerHorizontal(); setActivePopover(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent text-xs font-medium">
                            <AlignCenter className="w-4 h-4" /> H-Center
                        </button>
                        <button onClick={() => { centerVertical(); setActivePopover(null); }} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent text-xs font-medium">
                            <AlignCenter className="w-4 h-4 rotate-90" /> V-Center
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div className="h-px bg-border my-1 hidden lg:block opacity-50" />

            {/* Action Group */}
        <div className="flex flex-row lg:flex-col gap-1 items-center">
            <button 
              onClick={duplicateSelected} 
              disabled={selectedIds.length === 0 && !selectedId} 
              className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" 
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-medium">Copy</span>
            </button>

            <div className="flex flex-row lg:flex-col gap-1">
                <button 
                    onClick={groupElements}
                    disabled={selectedIds.length < 2}
                    className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" 
                    title="Group (Ctrl+G)"
                >
                    <Group className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-medium">Group</span>
                </button>
                
                <button 
                    onClick={ungroupElements}
                    disabled={!elements.some(el => selectedIds.includes(el.id) && el.groupId)}
                    className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" 
                    title="Ungroup (Ctrl+Shift+G)"
                >
                    <Ungroup className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-medium">Ungroup</span>
                </button>
            </div>

            <button onClick={deleteSelected} disabled={selectedIds.length === 0 && !selectedId} className="p-2.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" title="Delete">
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-medium">Delete</span>
            </button>
        </div>

        <div className="h-px bg-border my-1 hidden lg:block opacity-50" />

        <div className="flex flex-row lg:flex-col gap-1 items-center">
            <button 
              onClick={undo} 
              disabled={currentStep <= 0} 
              className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" 
              title="Undo"
            >
              <Undo2 className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[9px] font-medium">Undo</span>
            </button>

            <button 
              onClick={redo} 
              disabled={currentStep >= currentHistory.length - 1} 
              className="p-2.5 hover:bg-accent/10 rounded-lg text-text-secondary hover:text-accent transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" 
              title="Redo"
            >
              <Redo2 className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[9px] font-medium">Redo</span>
            </button>
        </div>

        <div className="h-px bg-border my-1 hidden lg:block opacity-50" />

        <div className="flex flex-col gap-1 items-center px-1">
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
            className="p-1.5 hover:bg-accent/10 rounded text-text-secondary hover:text-accent"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-bold text-text-secondary w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
            className="p-1.5 hover:bg-accent/10 rounded text-text-secondary hover:text-accent"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
            className="p-1.5 hover:bg-accent/10 rounded text-text-secondary hover:text-accent mt-1"
            title="Reset Zoom"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-px bg-border my-1 hidden lg:block opacity-50" />

        <button onClick={deleteSelected} disabled={!selectedId} className="p-2.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-all flex flex-col items-center gap-1 disabled:opacity-30 group" title="Delete Selected">
          <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-medium">Delete</span>
        </button>
        
        <div className="flex-1 lg:h-8" />
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`p-2.5 rounded-lg transition-all flex flex-col items-center gap-1 disabled:opacity-50 shadow-sm active:scale-95 ${
            saveStatus === 'success' ? 'bg-green-500 text-white' : 
            saveStatus === 'error' ? 'bg-red-500 text-white' : 
            'bg-accent text-white hover:bg-blue-600 hover:shadow-md'
          }`} 
          title="Save Active Page"
        >
          <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
          <span className="text-[9px] font-bold">
            {isSaving ? '...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Retry' : 'Save'}
          </span>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      </div>

      {/* Pages Container */}
      <div 
        id="canvas-container" 
        className={`flex-1 overflow-hidden relative bg-bg/20 rounded-2xl border border-border/50 ${isSpacePressed ? 'cursor-grab' : 'cursor-default'}`}
        onMouseDown={(e) => {
          if (isSpacePressed || e.button === 2) {
            e.preventDefault();
            (window as any)._isDraggingCanvas = true;
            (window as any)._lastDragPos = { x: e.clientX, y: e.clientY };
          }
        }}
        onMouseMove={(e) => {
          if ((window as any)._isDraggingCanvas) {
            const dx = (e.clientX - (window as any)._lastDragPos.x) / zoom;
            const dy = (e.clientY - (window as any)._lastDragPos.y) / zoom;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            (window as any)._lastDragPos = { x: e.clientX, y: e.clientY };
          }
        }}
        onMouseUp={() => {
          (window as any)._isDraggingCanvas = false;
        }}
        onMouseLeave={() => {
          (window as any)._isDraggingCanvas = false;
        }}
        onContextMenu={(e) => {
          if (isSpacePressed) e.preventDefault();
        }}
      >
        <div 
          className="flex flex-col gap-12 p-12 min-h-screen transition-transform duration-75 ease-out"
          style={{ 
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'top center'
          }}
        >
          <div className="flex items-center justify-between bg-card/90 backdrop-blur-md z-40 py-3 px-4 rounded-xl border border-border shadow-sm mb-4 sticky top-0">
            <div className="flex items-center gap-4">
               <div className="p-1.5 bg-accent/10 rounded-lg">
                  {isSpacePressed ? <Move className="w-4 h-4 text-accent animate-pulse" /> : <Palette className="w-4 h-4 text-accent" />}
               </div>
               <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight">Report Canvas Editor</h3>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isSpacePressed ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <span className="text-[10px] text-text-secondary font-medium">
                      Sheet {activePageIndex + 1} of {pages.length} active {isSpacePressed && '(Pan Mode Active - Drag Canvas)'}
                    </span>
                  </div>
               </div>
            </div>
            <button 
              onClick={onAddPage}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-accent/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add New A4 Sheet
            </button>
          </div>

          {pages.map((page, index) => (
            <div 
              key={page._id || index}
              onClick={() => setActivePageIndex(index)}
              className={`relative flex flex-col transition-all duration-300 ${
                activePageIndex === index 
                  ? 'ring-4 ring-accent rounded-xl shadow-2xl scale-[1.02] z-10' 
                  : 'opacity-70 hover:opacity-90 grayscale-[30%] hover:grayscale-0'
              }`}
            >
              {/* Page Controls */}
              <div className="absolute -top-4 left-6 px-4 py-1.5 bg-accent text-white text-[10px] font-black rounded-full shadow-xl z-20 ring-4 ring-card">
                SHEET {index + 1}
              </div>
              
              <div className="absolute -top-4 right-6 flex gap-2 z-20">
                 <button 
                   onClick={(e) => { e.stopPropagation(); onCopyPage(index); }}
                   className="flex items-center gap-1.5 px-4 py-2 bg-white border border-border text-text-secondary hover:text-accent rounded-xl text-[10px] font-bold shadow-xl transition-all active:scale-95 ring-4 ring-card"
                 >
                   <Plus className="w-3 h-3" /> Duplicate Page
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); onRemovePage(index); }}
                   className="flex items-center gap-1.5 px-4 py-2 bg-white border border-border text-text-secondary hover:text-red-500 rounded-xl text-[10px] font-bold shadow-xl transition-all active:scale-95 ring-4 ring-card"
                 >
                   <Trash2 className="w-3 h-3" /> Remove
                 </button>
              </div>

              <div className="bg-bg/40 p-12 flex justify-center shadow-inner rounded-3xl border border-border/50 group-hover:bg-bg/60 transition-colors">
                <div className="bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] pointer-events-auto transform-gpu" style={{ width: 595, height: 842 }}>
                  <Stage 
                    width={595} 
                    height={842} 
                    ref={activePageIndex === index ? stageRef : null} 
                    onMouseDown={(e) => {
                      if (isSpacePressed || e.evt.button === 2) {
                        // Let container handle it
                      } else {
                        checkDeselect(e);
                      }
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                    }}
                    onTouchStart={checkDeselect}
                  >
                    <Layer>
                      <Rect x={0} y={0} width={595} height={842} fill="white" />
                      {(index === activePageIndex ? elements : (allElements[index] || (page.content ? JSON.parse(page.content) : []))).map((el: any) => {
                        const props = {
                          key: el.id,
                          ...el,
                          isSelected: activePageIndex === index && selectedIds.includes(el.id),
                          onSelect: (e?: any) => {
                            if (isSpacePressed) return;
                            if (activePageIndex !== index) setActivePageIndex(index);
                            
                            // Multi-selection logic with group awareness
                            let newSelection = [el.id];
                            if (el.groupId) {
                              newSelection = elements.filter(item => item.groupId === el.groupId).map(item => item.id);
                            }

                            if (e?.evt?.shiftKey) {
                                // Add to current selection if shift is pressed
                                setSelectedIds(prev => Array.from(new Set([...prev, ...newSelection])));
                            } else {
                                setSelectedIds(newSelection);
                                setSelectedId(el.id);
                            }
                            setShowColorPicker(false);
                            setActivePopover(null);
                          },
                          onDblClick: () => {
                            if (isSpacePressed) return;
                            if (activePageIndex !== index) setActivePageIndex(index);
                            setSelectedIds([el.id]);
                            setSelectedId(el.id);
                            handleTextEdit();
                          },
                          onChange: (newAttrs: any) => {
                            if (activePageIndex === index) {
                              const targets = selectedIds.includes(el.id) ? selectedIds : [el.id];
                              const newElements = elements.map(item => {
                                if (targets.includes(item.id)) {
                                  if (item.id === el.id) return { ...item, ...newAttrs };
                                  
                                  // Update other selected elements based on leader's relative change or direct node state
                                  if (stageRef.current) {
                                    const node = stageRef.current.findOne('#' + item.id);
                                    if (node) {
                                      const scaleX = node.scaleX();
                                      const scaleY = node.scaleY();
                                      // Note: we don't reset scale here to avoid flickering 
                                      // as multiple onChanges might fire in succession
                                      return {
                                        ...item,
                                        x: node.x(),
                                        y: node.y(),
                                        width: item.width ? node.width() * scaleX : item.width,
                                        height: item.height ? node.height() * scaleY : item.height,
                                        radius: item.radius ? node.radius() * scaleX : item.radius,
                                        fontSize: item.fontSize ? node.fontSize() * scaleX : item.fontSize
                                      };
                                    }
                                  }
                                  
                                  // Fallback: simple copy if node not found
                                  return item;
                                }
                                return item;
                              });
                              pushToHistory(newElements);
                            }
                          }
                        };
                        if (el.type === 'text') return <TextComponent {...props} />;
                        if (el.type === 'rect') return <RectComponent {...props} />;
                        if (el.type === 'circle') return <CircleComponent {...props} />;
                        if (el.type === 'line') return <LineComponent {...props} />;
                        if (el.type === 'image') return <URLImage {...props} />;
                        return null;
                      })}
                      {activePageIndex === index && (
                          <Transformer
                              ref={transformerRef}
                              boundBoxFunc={(oldBox, newBox) => {
                                  // limit minimum size
                                  if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                                      return oldBox;
                                  }
                                  return newBox;
                              }}
                          />
                      )}
                      {selectionRect && (
                          <Rect
                              x={Math.min(selectionRect.x1, selectionRect.x2)}
                              y={Math.min(selectionRect.y1, selectionRect.y2)}
                              width={Math.abs(selectionRect.x1 - selectionRect.x2)}
                              height={Math.abs(selectionRect.y1 - selectionRect.y2)}
                              fill="rgba(59, 130, 246, 0.2)"
                              stroke="#3b82f6"
                              strokeWidth={1}
                          />
                      )}
                    </Layer>
                  </Stage>
                </div>
              </div>
              
              {activePageIndex !== index && (
                <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none group-hover:bg-accent/5 transition-colors" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Text Edit Modal */}
      <Modal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        title="Edit Text Content"
      >
        <div className="space-y-4">
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="w-full bg-bg border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent min-h-[100px]"
            placeholder="Enter your text here..."
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsTextModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveTextEdit}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Update Text
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
