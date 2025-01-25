import type { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';
import Footer from '../components/Footer/Footer';
import styles from '../styles/Studio.module.css';
import imageData from '@nouns/assets/dist/image-data.json';
import { ImageData as NounsImageData, getNounData, getPartData } from '@nouns/assets';
import type { DecodedImage } from '@nouns/sdk/dist/image/types';
import { ImageData } from "@nouns/assets";
import nounsImageData from '../utils/nouns-assets-package/image-data.json';

// Get the official Nouns palette and sort into color groups
const usedColors = new Set<string>();
const NOUNS_PALETTE = [
  // Whites and Light Grays
  ...nounsImageData.palette
    .filter(color => color !== '')
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      const avg = (r + g + b) / 3;
      return avg > 220 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Grays (including dark grays and blacks)
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      const avg = (r + g + b) / 3;
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      return maxDiff < 30 && avg <= 220;
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Blues
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return b > r && b > g && (b > 150 || (b > 80 && b > r * 1.2 && b > g * 1.2));
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Light Blues and Cyans
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return b > 100 && g > 100 && g/b > 0.7 && g/b < 1.1 && r < g;
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Greens
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return g > Math.max(r, b) && (g > 100 || (g > 60 && g > r * 1.2 && g > b * 1.2));
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Yellows and Light Greens
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > 150 && g > 150 && b < Math.min(r, g) * 0.9 && Math.abs(r - g) < 40;
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Reds and Pinks
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > Math.max(g, b) && (r > 150 || (r > 100 && r > g * 1.4 && r > b * 1.4));
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Purples
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > g && b > g && Math.abs(r - b) < 50 && (r > 80 || b > 80);
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Oranges and Browns
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .filter(color => {
      const [r, g, b] = [
        parseInt(color.slice(0, 2), 16),
        parseInt(color.slice(2, 4), 16),
        parseInt(color.slice(4, 6), 16)
      ];
      return r > g && g > b && (
        (r > 150 && g > 80) || 
        (r > 100 && g > 50 && b < 50) ||
        (r > g * 1.2 && g > b * 1.2)
      );
    })
    .map(color => {
      usedColors.add(color);
      return `#${color.toUpperCase()}`;
    }),

  // Add any remaining colors at the end
  ...nounsImageData.palette
    .filter(color => color !== '' && !usedColors.has(color))
    .map(color => `#${color.toUpperCase()}`)
];

const LAYERS = [
  { id: 'noggles', name: 'NOGGLES', icon: '🕶️' },
  { id: 'head', name: 'HEAD', icon: '🎨' },
  { id: 'accessory', name: 'ACCESSORY', icon: '🎩' },
  { id: 'body', name: 'BODY', icon: '👕' },
  { id: 'background', name: 'BACKGROUND', icon: '🖼️' }
] as const;

// Type for trait categories
type ImageCategory = 'bodies' | 'accessories' | 'heads' | 'glasses';
type TraitCategory = ImageCategory | 'bgcolors';
type LayerId = typeof LAYERS[number]['id'];
type Trait = { filename: string; data: string };

interface ImageData {
  bgcolors: string[];
  palette: string[];
  images: {
    [K in ImageCategory]: Trait[];
  };
}

const typedImageData = imageData as ImageData;

const TRAIT_CATEGORIES: Record<LayerId, TraitCategory> = {
  noggles: 'glasses',
  head: 'heads',
  accessory: 'accessories',
  body: 'bodies',
  background: 'bgcolors'
} as const;

// Helper function to decode RLE
const decodeRLE = (rle: string) => {
  // Remove '0x' prefix if present
  const data = rle.startsWith('0x') ? rle.slice(2) : rle;
  
  // Parse header
  const version = parseInt(data.slice(0, 2), 16);
  const width = parseInt(data.slice(2, 4), 16);
  const height = parseInt(data.slice(4, 6), 16);
  const chunks = parseInt(data.slice(6, 8), 16);

  return {
    version,
    width,
    height,
    chunks,
    data: data.slice(8)
  };
};

// Add this helper function to format trait names
const formatTraitName = (filename: string, category: LayerId) => {
  let name = filename;
  
  // Remove category prefix based on layer type
  switch (category) {
    case 'noggles':
      name = name.replace('glasses-', '');
      name = name.replace('square-', '');
      break;
    case 'head':
      name = name.replace('head-', '');
      break;
    case 'accessory':
      name = name.replace('accessory-', '');
      break;
    case 'body':
      name = name.replace('body-', '');
      break;
  }
  
  // Replace hyphens with spaces and capitalize each word
  return name.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Add this helper function for background names
const getBackgroundName = (index: number) => {
  switch (index) {
    case 0:
      return 'Cool';
    case 1:
      return 'Warm';
    default:
      return `Background ${index + 1}`;
  }
};

// Add export size options at the top level
const EXPORT_SIZES = [32, 64, 128, 256, 512, 1024];

const Studio: NextPage = () => {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState(NOUNS_PALETTE[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'fill' | 'eyedropper'>('pencil');
  const CANVAS_SIZE = 32;
  const PIXEL_SIZE = 16;

  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [activeLayer, setActiveLayer] = useState<typeof LAYERS[number]['id']>('noggles');
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(LAYERS.map(l => l.id)));

  // Add state for selected traits
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string>>({});

  // Add refs for layer canvases
  const layerCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Add export size state
  const [exportSize, setExportSize] = useState<number>(512);

  const [backgroundColor, setBackgroundColor] = useState<string>('white');
  const [currentNounId, setCurrentNounId] = useState<bigint>(BigInt(0));
  const [extractedColor, setExtractedColor] = useState<string>('white');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Add useEffect for mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Add export function inside component
  const exportAsPNG = () => {
    // Create a temporary canvas for the export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Enable pixel art rendering
    ctx.imageSmoothingEnabled = false;

    // Draw each visible layer in order (background to front)
    // Use the same z-index order as defined in the layer initialization
    const zIndexOrder: Record<string, number> = {
      background: 5,
      body: 6,
      accessory: 7,
      head: 8,
      noggles: 9
    };

    // Sort layers by z-index
    const orderedLayers = [...LAYERS].sort((a, b) => zIndexOrder[a.id] - zIndexOrder[b.id]);

    // Draw each visible layer
    orderedLayers.forEach(layer => {
      if (!visibleLayers.has(layer.id)) return;
      const layerCanvas = layerCanvasRefs.current[layer.id];
      if (!layerCanvas) return;

      // Scale up while maintaining pixel art quality
      ctx.drawImage(
        layerCanvas,
        0, 0, CANVAS_SIZE, CANVAS_SIZE,  // Source dimensions
        0, 0, exportSize, exportSize     // Destination dimensions
      );
    });

    // Create download link
    const link = document.createElement('a');
    link.download = 'noun.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // Function to draw a trait on its layer canvas
  const drawTrait = async (layerId: LayerId, traitData: string) => {
    const canvas = layerCanvasRefs.current[layerId];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the layer
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Ensure pixel art rendering
    ctx.imageSmoothingEnabled = false;

    if (layerId === 'background') {
      // Draw background color
      ctx.fillStyle = `#${traitData}`;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      return;
    }

    // Get trait data
    const category = TRAIT_CATEGORIES[layerId];
    if (category === 'bgcolors') return;
    
    const trait = typedImageData.images[category]?.find(t => t.filename === traitData);
    if (!trait) return;

    // Get the part data
    const traitIndex = typedImageData.images[category].indexOf(trait);

    try {
      // Call our API endpoint to generate the SVG
      const response = await fetch('/api/generateTrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, traitIndex }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate trait SVG: ${errorData.error}`);
      }

      const data = await response.json();
      
      // Create an image from the SVG
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      };
      img.src = `data:image/svg+xml;base64,${btoa(data.svg)}`;
    } catch (error) {
      console.error('Error drawing trait:', error);
    }
  };

  // Update handleTraitSelect to use the correct type
  const handleTraitSelect = (layerId: LayerId, trait: string) => {
    setSelectedTraits(prev => ({
      ...prev,
      [layerId]: trait
    }));
    
    if (trait) {
      drawTrait(layerId, trait);
    } else {
      // Clear the layer if no trait selected
      const canvas = layerCanvasRefs.current[layerId];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Initialize the grid
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas) return;

    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to 32x32 base resolution
    gridCanvas.width = CANVAS_SIZE;
    gridCanvas.height = CANVAS_SIZE;

    // Draw checkerboard pattern
    for (let x = 0; x < CANVAS_SIZE; x++) {
      for (let y = 0; y < CANVAS_SIZE; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#e0e0e0' : '#d0d0d0';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.05;
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }
  }, []);

  // Draw hover highlight
  useEffect(() => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas || !hoverPos) return;

    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    // Redraw the entire grid to clear previous highlight
    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Redraw checkerboard
    for (let x = 0; x < CANVAS_SIZE; x++) {
      for (let y = 0; y < CANVAS_SIZE; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#e0e0e0' : '#d0d0d0';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.05;
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw hover highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(
      hoverPos.x,
      hoverPos.y,
      1,
      1
    );
  }, [hoverPos]);

  // Initialize the drawing canvas
  useEffect(() => {
    const drawingCanvas = drawingCanvasRef.current;
    if (!drawingCanvas) return;

    drawingCanvas.width = CANVAS_SIZE;
    drawingCanvas.height = CANVAS_SIZE;
  }, []);

  const drawPixel = (x: number, y: number) => {
    const drawingCanvas = drawingCanvasRef.current;
    const activeLayerCanvas = layerCanvasRefs.current[activeLayer];
    if (!drawingCanvas || !activeLayerCanvas) return;

    const drawingCtx = drawingCanvas.getContext('2d');
    const activeLayerCtx = activeLayerCanvas.getContext('2d');
    if (!drawingCtx || !activeLayerCtx) return;

    if (tool === 'pencil') {
      drawingCtx.fillStyle = selectedColor;
      drawingCtx.fillRect(x, y, 1, 1);
    } else if (tool === 'eraser') {
      // For eraser, directly modify the active layer
      activeLayerCtx.clearRect(x, y, 1, 1);
      // Also clear the drawing canvas at this position
      drawingCtx.clearRect(x, y, 1, 1);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_SIZE / rect.width;
    const x = Math.floor((e.clientX - rect.left) * scale);
    const y = Math.floor((e.clientY - rect.top) * scale);

    // Update hover position
    setHoverPos({ x, y });

    if (!isDrawing || tool === 'fill') return;

    // If we have a last position, interpolate between it and current position
    if (lastPos.current) {
      const { x: lastX, y: lastY } = lastPos.current;
      
      // Bresenham's line algorithm for smooth drawing
      const dx = Math.abs(x - lastX);
      const dy = Math.abs(y - lastY);
      const sx = lastX < x ? 1 : -1;
      const sy = lastY < y ? 1 : -1;
      let err = dx - dy;

      let currentX = lastX;
      let currentY = lastY;

      while (true) {
        drawPixel(currentX, currentY);

        if (currentX === x && currentY === y) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          currentX += sx;
        }
        if (e2 < dx) {
          err += dx;
          currentY += sy;
        }
      }
    } else {
      drawPixel(x, y);
    }

    lastPos.current = { x, y };
  };

  const getPixelColor = (x: number, y: number, canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    
    if (data[3] === 0) return null; // Transparent pixel
    return `#${data[0].toString(16).padStart(2, '0')}${data[1].toString(16).padStart(2, '0')}${data[2].toString(16).padStart(2, '0')}`.toUpperCase();
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const activeLayerCanvas = layerCanvasRefs.current[activeLayer];
    if (!activeLayerCanvas) return;

    const ctx = activeLayerCanvas.getContext('2d');
    if (!ctx) return;

    const targetColor = getPixelColor(startX, startY, activeLayerCanvas);
    const pixelsToCheck = [{x: startX, y: startY}];
    const checked = new Set<string>();

    while (pixelsToCheck.length > 0) {
      const {x, y} = pixelsToCheck.pop()!;
      const key = `${x},${y}`;
      
      if (checked.has(key)) continue;
      if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue;
      
      const currentColor = getPixelColor(x, y, activeLayerCanvas);
      if (currentColor !== targetColor) continue;

      checked.add(key);
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, 1, 1);

      // Add adjacent pixels
      pixelsToCheck.push({x: x + 1, y});
      pixelsToCheck.push({x: x - 1, y});
      pixelsToCheck.push({x, y: y + 1});
      pixelsToCheck.push({x, y: y - 1});
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_SIZE / rect.width;
    const x = Math.floor((e.clientX - rect.left) * scale);
    const y = Math.floor((e.clientY - rect.top) * scale);

    if (tool === 'fill') {
      floodFill(x, y, selectedColor);
    } else if (tool === 'eyedropper') {
      pickColor(x, y);
    } else {
      setIsDrawing(true);
      drawPixel(x, y);
      lastPos.current = { x, y };
    }
  };

  const handleMouseUp = () => {
    // Transfer the drawing canvas content to the active layer
    const drawingCanvas = drawingCanvasRef.current;
    const activeLayerCanvas = layerCanvasRefs.current[activeLayer];
    if (drawingCanvas && activeLayerCanvas && tool === 'pencil') {
      const activeLayerCtx = activeLayerCanvas.getContext('2d');
      const drawingCtx = drawingCanvas.getContext('2d');
      if (activeLayerCtx && drawingCtx) {
        // Copy the drawing to the active layer
        activeLayerCtx.drawImage(drawingCanvas, 0, 0);
        // Clear the drawing canvas
        drawingCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }
    }

    setIsDrawing(false);
    lastPos.current = null;
  };

  const handleMouseLeave = () => {
    // Also transfer the drawing when mouse leaves
    handleMouseUp();
    setHoverPos(null);
  };

  const toggleLayerVisibility = (layerId: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Initialize layer canvases
  useEffect(() => {
    // Define z-index order (lower number = further back)
    const zIndexOrder: Record<string, number> = {
      background: 5,
      body: 6,
      accessory: 7,
      head: 8,
      noggles: 9
    };

    LAYERS.forEach(layer => {
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      canvas.className = styles.layerCanvas;
      canvas.style.zIndex = zIndexOrder[layer.id].toString();
      
      // Get the context and set pixel art rendering
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
      }
      
      layerCanvasRefs.current[layer.id] = canvas;
    });
  }, []);

  // Add layer canvases to DOM and draw initial traits if selected
  useEffect(() => {
    const canvasStack = document.querySelector(`.${styles.canvasStack}`);
    if (!canvasStack) return;

    LAYERS.forEach(layer => {
      const canvas = layerCanvasRefs.current[layer.id];
      if (canvas && !canvasStack.contains(canvas)) {
        canvasStack.appendChild(canvas);
        // Draw initial trait if selected
        const selectedTrait = selectedTraits[layer.id];
        if (selectedTrait) {
          drawTrait(layer.id as LayerId, selectedTrait);
        }
      }
    });

    return () => {
      LAYERS.forEach(layer => {
        const canvas = layerCanvasRefs.current[layer.id];
        if (canvas && canvasStack.contains(canvas)) {
          canvasStack.removeChild(canvas);
        }
      });
    };
  }, [selectedTraits]); // Add selectedTraits as dependency

  // Update layer visibility
  useEffect(() => {
    LAYERS.forEach(layer => {
      const canvas = layerCanvasRefs.current[layer.id];
      if (canvas) {
        canvas.style.visibility = visibleLayers.has(layer.id) ? 'visible' : 'hidden';
      }
    });
  }, [visibleLayers]);

  // Add eyedropper functionality
  const pickColor = (x: number, y: number) => {
    // Try to get color from active layer first
    const activeLayerCanvas = layerCanvasRefs.current[activeLayer];
    if (activeLayerCanvas) {
      const color = getPixelColor(x, y, activeLayerCanvas);
      if (color && NOUNS_PALETTE.includes(color.toUpperCase())) {
        setSelectedColor(color.toUpperCase());
        setTool('pencil'); // Switch back to pencil after picking
        return;
      }
    }

    // If no color on active layer, check all visible layers from top to bottom
    const orderedLayers = [...LAYERS].reverse();
    for (const layer of orderedLayers) {
      if (!visibleLayers.has(layer.id)) continue;
      const canvas = layerCanvasRefs.current[layer.id];
      if (canvas) {
        const color = getPixelColor(x, y, canvas);
        if (color && NOUNS_PALETTE.includes(color.toUpperCase())) {
          setSelectedColor(color.toUpperCase());
          setTool('pencil'); // Switch back to pencil after picking
          return;
        }
      }
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.main}>
        {isMobile && (
          <div className={styles.mobileWarning}>
            ⚠️ Best experienced on desktop
          </div>
        )}
        <div className={styles.studioContainer}>
          <div className={styles.toolbox}>
            <div className={styles.tools}>
              <button 
                className={`${styles.tool} ${tool === 'pencil' ? styles.active : ''}`}
                onClick={() => setTool('pencil')}
                title="Pencil Tool"
              >
                <div className={styles.win95Icon}>
                  <img src="/pencil.png" alt="Pencil" width="16" height="16" />
                </div>
              </button>
              <button 
                className={`${styles.tool} ${tool === 'eraser' ? styles.active : ''}`}
                onClick={() => setTool('eraser')}
                title="Eraser Tool"
              >
                <div className={styles.win95Icon}>
                  <img src="/eraser.png" alt="Eraser" width="16" height="16" />
                </div>
              </button>
              <button 
                className={`${styles.tool} ${tool === 'fill' ? styles.active : ''}`}
                onClick={() => setTool('fill')}
                title="Fill Tool"
              >
                <div className={styles.win95Icon}>
                  <img src="/bucket.png" alt="Fill" width="16" height="16" />
                </div>
              </button>
              <button 
                className={`${styles.tool} ${tool === 'eyedropper' ? styles.active : ''}`}
                onClick={() => setTool('eyedropper')}
                title="Color Picker"
              >
                <div className={styles.win95Icon}>
                  <img src="/eyedropper.png" alt="Color Picker" width="16" height="16" />
                </div>
              </button>
            </div>

            {isMobile ? (
              <div className={styles.colorPaletteContainer}>
                <button 
                  className={styles.colorPaletteButton}
                  onClick={() => setIsPaletteOpen(true)}
                >
                  Colors <div className={styles.colorPalettePreview} style={{ backgroundColor: selectedColor }} />
                </button>
                {isPaletteOpen && (
                  <div className={`${styles.colorPalette} ${styles.popup}`}>
                    <button 
                      className={styles.closeButton}
                      onClick={() => setIsPaletteOpen(false)}
                    >
                      ×
                    </button>
                    {NOUNS_PALETTE.map((color) => (
                      <button
                        key={color}
                        className={`${styles.colorSwatch} ${color === selectedColor ? styles.active : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setSelectedColor(color);
                          setIsPaletteOpen(false);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.colorPalette}>
                {NOUNS_PALETTE.map((color) => (
                  <button
                    key={color}
                    className={`${styles.colorSwatch} ${color === selectedColor ? styles.active : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.canvasWrapper}>
            <div className={styles.canvasStack}>
              <canvas
                ref={gridCanvasRef}
                className={styles.gridCanvas}
              />
              <canvas
                ref={drawingCanvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className={styles.drawingCanvas}
              />
            </div>
          </div>

          <div className={styles.layersPanel}>
            <div className={styles.helpSection}>
              <div className={styles.helpTitle}>How to Use</div>
              <ul className={styles.helpList}>
                <li><span className={styles.helpIcon}>↑</span> Click a layer to select it - your edits will appear on the selected layer</li>
                <li><span className={styles.helpIcon}>□</span> Select traits from the dropdowns or draw your own</li>
                <li>
                  <span className={styles.helpIcon}>
                    <img src="/pencil.png" alt="Pencil" width="16" height="16" className={styles.helpIconImg} />
                  </span>
                  Use pencil to draw pixel by pixel
                </li>
                <li>
                  <span className={styles.helpIcon}>
                    <img src="/bucket.png" alt="Fill" width="16" height="16" className={styles.helpIconImg} />
                  </span>
                  Use fill tool to fill areas
                </li>
                <li>
                  <span className={styles.helpIcon}>
                    <img src="/eraser.png" alt="Eraser" width="16" height="16" className={styles.helpIconImg} />
                  </span>
                  Use eraser to remove pixels
                </li>
                <li>
                  <span className={styles.helpIcon}>
                    <img src="/eyedropper.png" alt="Color Picker" width="16" height="16" className={styles.helpIconImg} />
                  </span>
                  Use color picker to select colors from the canvas
                </li>
                <li><span className={styles.helpIcon}>◉</span> Toggle layers on/off - only visible layers will be exported</li>
              </ul>
            </div>
            <div className={styles.exportSection}>
              <div className={styles.exportTitle}>Export</div>
              <div className={styles.exportControls}>
                <select 
                  className={styles.sizeSelect}
                  value={exportSize}
                  onChange={(e) => setExportSize(Number(e.target.value))}
                >
                  {EXPORT_SIZES.map(size => (
                    <option key={size} value={size}>
                      {size}x{size}
                    </option>
                  ))}
                </select>
                <button 
                  className={styles.exportButton}
                  onClick={exportAsPNG}
                >
                  <span className={styles.win95Icon}>↓</span> Export PNG
                </button>
              </div>
            </div>
            {LAYERS.map((layer) => (
              <div 
                key={layer.id}
                className={`${styles.layer} ${activeLayer === layer.id ? styles.active : ''}`}
                onClick={() => setActiveLayer(layer.id)}
              >
                <div className={styles.layerPreview}>
                  <img 
                    src={`/${layer.id}.svg`} 
                    alt={layer.name} 
                    className={styles.layerIcon}
                  />
                </div>
                <span className={styles.layerName}>{layer.name}</span>
                <div className={styles.layerControls}>
                  <button
                    className={styles.layerControl}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                  >
                    {visibleLayers.has(layer.id) ? 
                      <span className={styles.win95Icon}>◉</span> : 
                      <span className={styles.win95Icon}>○</span>
                    }
                  </button>
                  <select 
                    className={styles.traitSelect}
                    value={selectedTraits[layer.id] || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleTraitSelect(layer.id as LayerId, e.target.value);
                    }}
                  >
                    <option value="">Select {layer.name}</option>
                    {layer.id === 'background' ? (
                      typedImageData.bgcolors.map((color, index) => (
                        <option key={index} value={color}>
                          {getBackgroundName(index)}
                        </option>
                      ))
                    ) : (
                      [...typedImageData.images[TRAIT_CATEGORIES[layer.id as LayerId] as ImageCategory]]
                        .sort((a, b) => formatTraitName(a.filename, layer.id as LayerId)
                          .localeCompare(formatTraitName(b.filename, layer.id as LayerId)))
                        .map((trait, index) => (
                          <option key={index} value={trait.filename}>
                            {formatTraitName(trait.filename, layer.id as LayerId)}
                          </option>
                        ))
                    )}
                  </select>
                  <button className={styles.layerControl}>⋮</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Studio; 