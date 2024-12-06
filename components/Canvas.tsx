'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Canvas as FabricCanvas,
  Rect,
  Circle,
  IText,
  PencilBrush,
  Image as FabricImage,
  Object as FabricObject,
  ImageFilters,
  Line,
} from 'fabric';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  MousePointer,
  Edit,
  Trash2,
  Square as SquareIcon,
  Circle as CircleIcon,
  Type,
  RotateCcw,
  RotateCw,
  Download,
  Save as SaveIcon,
  Upload,
  Image as ImageIcon,
  Filter,
  Layers,
} from 'react-feather';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState<'select' | 'draw' | 'erase'>('select');
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [selectedText, setSelectedText] = useState<IText | null>(null);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState<boolean>(false); // State for modal visibility

  // Initialize Fabric.js Canvas
  useEffect(() => {
    if (!canvas && canvasRef.current) {
      const fabricCanvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      });
      setCanvas(fabricCanvas);

      // Enable selection
      fabricCanvas.selection = true;

      // Initial grid drawing
      drawGrid(fabricCanvas);

      // Save the initial state
      saveState(fabricCanvas);
    }

    return () => {
      canvas?.dispose();
    };
  }, [canvas]);

  // Save Canvas State
  const saveState = (currentCanvas: FabricCanvas) => {
    const json = JSON.stringify(currentCanvas);
    setHistory((prev) => [...prev, json]);
    setRedoStack([]); // Clear redo stack on new action
  };

  // Undo Functionality
  const undo = () => {
    if (history.length > 1) {
      const prevState = history[history.length - 2];
      setRedoStack((prev) => [...prev, history.pop()!]);
      canvas?.loadFromJSON(prevState, () => {
        canvas.renderAll();
        setHistory([...history]);
      });
    }
  };

  // Redo Functionality
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop()!;
      setHistory((prev) => [...prev, nextState]);
      canvas?.loadFromJSON(nextState, () => canvas.renderAll());
    }
  };

  // Add Rectangle
  const addRectangle = () => {
    if (canvas) {
      const rect = new Rect({
        width: 100,
        height: 100,
        fill: '#0000ff',
        left: 50,
        top: 50,
      });
      canvas.add(rect);
      saveState(canvas);
    }
  };

  // Add Circle
  const addCircle = () => {
    if (canvas) {
      const circle = new Circle({
        radius: 50,
        fill: '#00ff00',
        left: 200,
        top: 200,
      });
      canvas.add(circle);
      saveState(canvas);
    }
  };

  // Add Text
  const addText = () => {
    if (canvas) {
      const text = new IText('Edit me!', {
        left: 300,
        top: 300,
        fontSize: 20,
        fill: '#000000',
      });
      canvas.add(text);
      saveState(canvas);
    }
  };

  // Export Canvas to Image
  const exportCanvas = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1, // Ensures no scaling
      });
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'canvas.png';
      link.click();
    }
  };

  // Activate Tools
  const activateSelect = () => {
    if (canvas) {
      canvas.isDrawingMode = false;
      setCurrentTool('select');
    }
  };

  const activateBrush = () => {
    if (canvas) {
      const brush = new PencilBrush(canvas);
      brush.color = '#000000';
      brush.width = 5;
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
      setCurrentTool('draw');
    }
  };

  const activateEraser = () => {
    if (canvas) {
      const brush = new PencilBrush(canvas);
      brush.color = 'rgba(0,0,0,1)';
      brush.width = 10;
      // Use 'destination-out' to simulate eraser
      brush.globalCompositeOperation = 'destination-out';
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
      setCurrentTool('erase');
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && canvas) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function (f) {
        FabricImage.fromURL(f.target?.result as string, (img) => {
          img.scaleToWidth(300);
          canvas.add(img);
          saveState(canvas);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply Filters
  const applyFilter = (filterType: string) => {
    const activeObject = canvas?.getActiveObject() as FabricImage;
    if (activeObject && activeObject.type === 'image') {
      switch (filterType) {
        case 'grayscale':
          activeObject.filters = [new ImageFilters.Grayscale()];
          break;
        case 'sepia':
          activeObject.filters = [new ImageFilters.Sepia()];
          break;
        // Add more filters as needed
      }
      activeObject.applyFilters();
      canvas?.renderAll();
      saveState(canvas!);
    }
  };

  // Update Selected Object
  useEffect(() => {
    if (canvas) {
      const updateSelection = (e: any) => {
        const target = e.target;
        setSelectedObject(target);
        if (target && target.type === 'i-text') {
          setSelectedText(target as IText);
        } else {
          setSelectedText(null);
        }
      };
      canvas.on('selection:created', updateSelection);
      canvas.on('selection:updated', updateSelection);
      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setSelectedText(null);
      });
    }
  }, [canvas]);

  // Update Object Color
  const updateObjectColor = (property: string, value: string) => {
    if (selectedObject) {
      selectedObject.set(property, value);
      canvas?.renderAll();
      saveState(canvas!);
    }
  };

  // Update Text Properties
  const updateTextProperty = (property: string, value: any) => {
    if (selectedText) {
      selectedText.set(property, value);
      canvas?.renderAll();
      saveState(canvas!);
    }
  };

  // Draw Grid
  const drawGrid = (canvas: FabricCanvas) => {
    const gridSize = 50;
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    // Draw vertical lines
    for (let i = 0; i <= width / gridSize; i++) {
      const distance = i * gridSize;
      const line = new Line([distance, 0, distance, height], {
        stroke: '#e0e0e0',
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      canvas.add(line);
    }

    // Draw horizontal lines
    for (let i = 0; i <= height / gridSize; i++) {
      const distance = i * gridSize;
      const line = new Line([0, distance, width, distance], {
        stroke: '#e0e0e0',
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      canvas.add(line);
    }

    // Snap to grid
    canvas.on('object:moving', (options) => {
      options.target.set({
        left: Math.round(options.target.left / gridSize) * gridSize,
        top: Math.round(options.target.top / gridSize) * gridSize,
      });
    });
  };

  // Save Project
  const saveProject = () => {
    if (canvas) {
      const json = JSON.stringify(canvas.toJSON());
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'project.json';
      link.click();
    }
  };

  // Load Project
  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && canvas) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function (f) {
        const json = f.target?.result as string;
        canvas.loadFromJSON(json, () => {
          canvas.renderAll();
          saveState(canvas);
        });
      };
      reader.readAsText(file);
    }
  };

  // Layer Manager Component
  const LayerManager: React.FC<{ canvas: FabricCanvas | null }> = ({ canvas }) => {
    const [objects, setObjects] = useState<FabricObject[]>([]);

    useEffect(() => {
      if (canvas) {
        const updateObjects = () => {
          setObjects([...canvas.getObjects()] as FabricObject[]);
        };

        // Initial update
        updateObjects();

        // Listen for changes
        canvas.on('object:added', updateObjects);
        canvas.on('object:removed', updateObjects);
        canvas.on('object:modified', updateObjects);
        canvas.on('object:moved', updateObjects);

        return () => {
          canvas.off('object:added', updateObjects);
          canvas.off('object:removed', updateObjects);
          canvas.off('object:modified', updateObjects);
          canvas.off('object:moved', updateObjects);
        };
      }
    }, [canvas]);

    // Toggle visibility
    const toggleVisibility = (obj: FabricObject) => {
      obj.visible = !obj.visible;
      canvas?.renderAll();
    };

    // Lock/Unlock layer
    const toggleLock = (obj: FabricObject) => {
      const isLocked = obj.lockMovementX;
      obj.lockMovementX = !isLocked;
      obj.lockMovementY = !isLocked;
      obj.lockScalingX = !isLocked;
      obj.lockScalingY = !isLocked;
      obj.lockRotation = !isLocked;
      obj.selectable = isLocked;
      canvas?.renderAll();
    };

    // Bring layer forward
    const bringForward = (obj: FabricObject) => {
      canvas?.bringForward(obj);
      canvas?.renderAll();
    };

    // Send layer backward
    const sendBackward = (obj: FabricObject) => {
      canvas?.sendBackwards(obj);
      canvas?.renderAll();
    };

    return (
      <div>
        <h3 className="text-lg font-semibold mb-2">Layers</h3>
        <ul className="space-y-2">
          {objects
            .slice()
            .reverse()
            .map((obj, index) => (
              <li key={index} className="flex items-center space-x-2">
                <span className="flex-grow capitalize">{obj.type}</span>
                <button onClick={() => toggleVisibility(obj)}>
                  {obj.visible ? (
                    <Eye className="w-5 h-5 text-gray-600 hover:text-blue-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-600 hover:text-blue-500" />
                  )}
                </button>
                <button onClick={() => toggleLock(obj)}>
                  {obj.lockMovementX ? (
                    <Lock className="w-5 h-5 text-gray-600 hover:text-blue-500" />
                  ) : (
                    <Unlock className="w-5 h-5 text-gray-600 hover:text-blue-500" />
                  )}
                </button>
                <button onClick={() => bringForward(obj)}>
                  <ArrowUp className="w-5 h-5 text-gray-600 hover:text-blue-500" />
                </button>
                <button onClick={() => sendBackward(obj)}>
                  <ArrowDown className="w-5 h-5 text-gray-600 hover:text-blue-500" />
                </button>
              </li>
            ))}
        </ul>
      </div>
    );
  };

  // Save state on object changes
  useEffect(() => {
    if (canvas) {
      const events = ['object:added', 'object:removed', 'object:modified'];
      events.forEach((event) => {
        canvas.on(event, () => saveState(canvas));
      });
    }
  }, [canvas]);

  return (
    <div className="flex">
      {/* Toolbar */}
      <div className="w-16 bg-gray-200 flex flex-col items-center py-2">
        <button onClick={activateSelect} className="p-2 hover:bg-gray-300 rounded">
          <MousePointer className="w-6 h-6" />
        </button>
        <button onClick={activateBrush} className="p-2 hover:bg-gray-300 rounded">
          <Edit className="w-6 h-6" />
        </button>
        <button onClick={activateEraser} className="p-2 hover:bg-gray-300 rounded">
          <Trash2 className="w-6 h-6" />
        </button>
        <button onClick={addRectangle} className="p-2 hover:bg-gray-300 rounded">
          <SquareIcon className="w-6 h-6" />
        </button>
        <button onClick={addCircle} className="p-2 hover:bg-gray-300 rounded">
          <CircleIcon className="w-6 h-6" />
        </button>
        <button onClick={addText} className="p-2 hover:bg-gray-300 rounded">
          <Type className="w-6 h-6" />
        </button>
        <button onClick={undo} className="p-2 hover:bg-gray-300 rounded">
          <RotateCcw className="w-6 h-6" />
        </button>
        <button onClick={redo} className="p-2 hover:bg-gray-300 rounded">
          <RotateCw className="w-6 h-6" />
        </button>
        <button onClick={exportCanvas} className="p-2 hover:bg-gray-300 rounded">
          <Download className="w-6 h-6" />
        </button>
        <button onClick={saveProject} className="p-2 hover:bg-gray-300 rounded">
          <SaveIcon className="w-6 h-6" />
        </button>
        <label className="p-2 hover:bg-gray-300 rounded cursor-pointer">
          <Upload className="w-6 h-6" />
          <input
            type="file"
            accept=".json"
            onChange={loadProject}
            className="hidden"
          />
        </label>
        <label className="p-2 hover:bg-gray-300 rounded cursor-pointer">
          <ImageIcon className="w-6 h-6" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
        <button onClick={() => applyFilter('grayscale')} className="p-2 hover:bg-gray-300 rounded">
          <Filter className="w-6 h-6" />
        </button>
        <button onClick={() => applyFilter('sepia')} className="p-2 hover:bg-gray-300 rounded">
          <Filter className="w-6 h-6 text-yellow-600" />
        </button>
        {/* Layers Modal Button */}
        <button onClick={() => setIsLayerModalOpen(true)} className="p-2 hover:bg-gray-300 rounded">
          <Layers className="w-6 h-6" />
        </button>
        {/* Add more tool buttons as needed */}
      </div>

      {/* Canvas and Controls */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="border border-gray-300" />
        {/* Color Pickers */}
        {selectedObject && selectedObject.type !== 'image' && (
          <div className="mt-2">
            <label className="flex items-center space-x-2">
              <span>Fill Color:</span>
              <input
                type="color"
                value={selectedObject.fill as string}
                onChange={(e) => updateObjectColor('fill', e.target.value)}
                className="w-8 h-8 p-0 border-none"
              />
            </label>
            <label className="flex items-center space-x-2">
              <span>Stroke Color:</span>
              <input
                type="color"
                value={(selectedObject.stroke as string) || '#000000'}
                onChange={(e) => updateObjectColor('stroke', e.target.value)}
                className="w-8 h-8 p-0 border-none"
              />
            </label>
          </div>
        )}
        {/* Text Styling Controls */}
        {selectedText && (
          <div className="mt-2">
            <label className="flex items-center space-x-2">
              <span>Font Family:</span>
              <select
                value={selectedText.fontFamily}
                onChange={(e) => updateTextProperty('fontFamily', e.target.value)}
                className="p-1 border border-gray-300 rounded"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                {/* Add more fonts */}
              </select>
            </label>
            <label className="flex items-center space-x-2">
              <span>Font Size:</span>
              <input
                type="number"
                value={selectedText.fontSize}
                onChange={(e) => updateTextProperty('fontSize', parseInt(e.target.value))}
                className="w-16 p-1 border border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center space-x-2">
              <span>Text Color:</span>
              <input
                type="color"
                value={selectedText.fill as string}
                onChange={(e) => updateTextProperty('fill', e.target.value)}
                className="w-8 h-8 p-0 border-none"
              />
            </label>
            <label className="flex items-center space-x-2">
              <span>Text Alignment:</span>
              <select
                value={selectedText.textAlign}
                onChange={(e) => updateTextProperty('textAlign', e.target.value)}
                className="p-1 border border-gray-300 rounded"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Layers Modal */}
      {isLayerModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Modal Overlay */}
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setIsLayerModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="bg-white p-4 rounded shadow-lg z-50 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Layers</h2>
              <button onClick={() => setIsLayerModalOpen(false)}>
                <svg
                  className="w-6 h-6 text-gray-600 hover:text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <LayerManager canvas={canvas} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;