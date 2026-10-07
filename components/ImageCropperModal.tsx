"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  RefreshCcw,
  Crop,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  ChevronRight,
  Move,
} from "lucide-react";

export interface AspectRatioOption {
  label: string;
  value: number | null; // null for freeform
  icon?: React.ReactNode;
}

export const DEFAULT_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "1:1 Square", value: 1, icon: <Square className="w-3.5 h-3.5" /> },
  { label: "4:5 Portrait", value: 4 / 5, icon: <RectangleVertical className="w-3.5 h-3.5" /> },
  { label: "3:4 Portrait", value: 3 / 4, icon: <RectangleVertical className="w-3.5 h-3.5" /> },
  { label: "16:9 Banner", value: 16 / 9, icon: <RectangleHorizontal className="w-3.5 h-3.5" /> },
  { label: "21:9 Ultra", value: 21 / 9, icon: <RectangleHorizontal className="w-3.5 h-3.5" /> },
  { label: "Freeform", value: null, icon: <Crop className="w-3.5 h-3.5" /> },
];

export interface ImageCropperModalProps {
  isOpen: boolean;
  files: File[] | File | null;
  aspectRatio?: number | null; // initial aspect ratio (default 1)
  circularCrop?: boolean; // circular mask for avatars
  lockAspectRatio?: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onCropComplete: (croppedFiles: File[]) => void;
}

export default function ImageCropperModal({
  isOpen,
  files,
  aspectRatio = 1,
  circularCrop = false,
  lockAspectRatio = false,
  title = "Adjust & Crop Photo",
  description = "Drag to reposition, use slider to zoom, and rotate to fit perfectly.",
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  // Normalize files array
  const fileList = React.useMemo(() => {
    if (!files) return [];
    return Array.isArray(files) ? files : [files];
  }, [files]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [croppedAccumulator, setCroppedAccumulator] = useState<File[]>([]);
  const [activeRatio, setActiveRatio] = useState<number | null>(aspectRatio ?? 1);

  // Transform states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // DOM & Image refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });

  const currentFile = fileList[currentIndex];

  // Initialize or change file
  useEffect(() => {
    if (!currentFile) {
      setImageSrc("");
      return;
    }
    const url = URL.createObjectURL(currentFile);
    setImageSrc(url);

    // Reset transformations
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setActiveRatio(aspectRatio ?? 1);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentFile, aspectRatio]);

  // Reset accumulator when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setCroppedAccumulator([]);
    }
  }, [isOpen]);

  // Calculate crop box dimensions based on container and active ratio
  const [cropBox, setCropBox] = useState({ width: 340, height: 340 });

  const updateCropBox = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    const padX = 32;
    const padY = 32;
    const maxW = Math.max(160, clientWidth - padX);
    const maxH = Math.max(160, clientHeight - padY);

    let ratio = activeRatio;
    if (ratio === null || ratio <= 0) {
      // freeform: follow image natural aspect ratio if available, else container ratio
      if (naturalDimensions.width > 0 && naturalDimensions.height > 0) {
        ratio = naturalDimensions.width / naturalDimensions.height;
      } else {
        ratio = 1;
      }
    }

    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }

    setCropBox({
      width: Math.round(w),
      height: Math.round(h),
    });
  }, [activeRatio, naturalDimensions]);

  useEffect(() => {
    updateCropBox();
    const handleResize = () => updateCropBox();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateCropBox]);

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imageRef.current = img;
    setNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  // Base scale calculation so image covers crop box at zoom = 1
  const baseScale = React.useMemo(() => {
    if (!naturalDimensions.width || !naturalDimensions.height) return 1;
    const isSideways = rotation % 180 !== 0;
    const effW = isSideways ? naturalDimensions.height : naturalDimensions.width;
    const effH = isSideways ? naturalDimensions.width : naturalDimensions.height;

    const scaleX = cropBox.width / effW;
    const scaleY = cropBox.height / effH;
    return Math.max(scaleX, scaleY);
  }, [naturalDimensions, rotation, cropBox]);

  // Mouse / Touch handlers for panning
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    panStartRef.current = { ...pan };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(1, Math.round((prev + delta) * 100) / 100)));
  };

  // Reset current image settings
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
  };

  // Rotate clockwise
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Rotate counter-clockwise
  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Flip horizontal
  const handleFlipH = () => {
    setFlipH((prev) => !prev);
  };

  // High-Resolution Canvas Crop Export
  const generateCroppedFile = async (): Promise<File> => {
    if (!imageRef.current || !currentFile) return currentFile;

    const img = imageRef.current;
    const cropW = cropBox.width;
    const cropH = cropBox.height;

    // Determine output resolution (crisp, native or up to 2400px)
    const outRatio = cropW / cropH;
    let outW = Math.min(2400, Math.max(cropW, naturalDimensions.width));
    let outH = Math.round(outW / outRatio);
    if (outH > 2400) {
      outH = 2400;
      outW = Math.round(outH * outRatio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return currentFile;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const S = outW / cropW;
    const totalScale = baseScale * zoom * S;

    // Center canvas
    ctx.save();
    ctx.translate(outW / 2 + pan.x * S, outH / 2 + pan.y * S);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -totalScale : totalScale, totalScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Export to Blob
    const mimeType = currentFile.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = 0.92;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(currentFile);
            return;
          }
          const cleanName = currentFile.name.replace(/\.[^/.]+$/, "");
          const ext = mimeType === "image/png" ? "png" : "jpg";
          const croppedFile = new File([blob], `${cleanName}-cropped.${ext}`, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        },
        mimeType,
        quality
      );
    });
  };

  // Apply crop for current image and either advance or finish
  const handleApplyCrop = async () => {
    if (!currentFile) return;
    setIsExporting(true);
    try {
      const cropped = await generateCroppedFile();
      const updatedAccumulator = [...croppedAccumulator, cropped];

      if (currentIndex + 1 < fileList.length) {
        setCroppedAccumulator(updatedAccumulator);
        setCurrentIndex(currentIndex + 1);
      } else {
        onCropComplete(updatedAccumulator);
        onClose();
      }
    } catch (err) {
      console.error("Cropping failed:", err);
      // Fallback: pass through original
      const updatedAccumulator = [...croppedAccumulator, currentFile];
      if (currentIndex + 1 < fileList.length) {
        setCroppedAccumulator(updatedAccumulator);
        setCurrentIndex(currentIndex + 1);
      } else {
        onCropComplete(updatedAccumulator);
        onClose();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Skip cropping for current image (keep original)
  const handleSkipCurrent = () => {
    if (!currentFile) return;
    const updatedAccumulator = [...croppedAccumulator, currentFile];
    if (currentIndex + 1 < fileList.length) {
      setCroppedAccumulator(updatedAccumulator);
      setCurrentIndex(currentIndex + 1);
    } else {
      onCropComplete(updatedAccumulator);
      onClose();
    }
  };

  if (!isOpen || fileList.length === 0 || !currentFile) {
    return null;
  }

  const isMulti = fileList.length > 1;
  const totalScale = baseScale * zoom;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[95vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden text-stone-100 select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-900/90 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Crop className="w-5 h-5 text-rose-400" />
                {title}
              </h2>
              {isMulti && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Image {currentIndex + 1} of {fileList.length}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 hidden sm:block">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aspect Ratio Selector (if not locked) */}
        {!lockAspectRatio && !circularCrop && (
          <div className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-950/60 border-b border-stone-800/80 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1.5">
              Aspect Ratio:
            </span>
            {DEFAULT_ASPECT_RATIOS.map((opt) => {
              const isSelected =
                (opt.value === null && activeRatio === null) ||
                (opt.value !== null && activeRatio !== null && Math.abs(opt.value - activeRatio) < 0.01);
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setActiveRatio(opt.value);
                    setPan({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-rose-500 text-white font-semibold shadow-sm"
                      : "bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Cropper Viewport */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) {
              handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={handlePointerUp}
          className="relative flex-1 min-h-[320px] sm:min-h-[420px] bg-stone-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        >
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Interactive Image Container */}
          <div
            style={{
              width: cropBox.width,
              height: cropBox.height,
            }}
            className={`relative overflow-hidden ring-2 ring-rose-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] z-10 ${
              circularCrop ? "rounded-full ring-rose-400" : "rounded-none"
            }`}
          >
            {/* The Image */}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  maxWidth: "none",
                  maxHeight: "none",
                  transformOrigin: "center center",
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${
                    flipH ? -totalScale : totalScale
                  }, ${totalScale})`,
                  willChange: "transform",
                  transition: isDragging ? "none" : "transform 0.05s ease-out",
                }}
              />
            )}

            {/* Rule of thirds grid guidelines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div />
            </div>

            {/* Corner Markers (Standard photographic crop marks) */}
            {!circularCrop && (
              <>
                <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white pointer-events-none" />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white pointer-events-none" />
              </>
            )}

            {/* Drag helper hint overlay */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-stone-300 font-medium pointer-events-none flex items-center gap-1 opacity-70">
              <Move className="w-2.5 h-2.5" /> Drag to position
            </div>
          </div>
        </div>

        {/* Adjustments Toolbar */}
        <div className="px-5 py-3 bg-stone-900 border-t border-stone-800 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 flex-1 min-w-[220px] max-w-sm">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.1) * 10) / 10))}
                className="p-1 rounded text-stone-400 hover:text-white transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))}
                className="p-1 rounded text-stone-400 hover:text-white transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium text-stone-400 w-11 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Transform buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleRotateCcw}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                title="Rotate 90° Counter-Clockwise"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotateCw}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFlipH}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  flipH
                    ? "bg-rose-500 text-white"
                    : "bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                }`}
                title="Flip Horizontally"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
                title="Reset View"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 truncate max-w-[200px] sm:max-w-[280px]">
                {currentFile.name}
              </span>
              {naturalDimensions.width > 0 && (
                <span className="text-[11px] font-mono text-stone-500 hidden sm:inline">
                  ({naturalDimensions.width} × {naturalDimensions.height}px)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Skip Crop button */}
              <button
                type="button"
                onClick={handleSkipCurrent}
                disabled={isExporting}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
              >
                Skip Crop
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 transition cursor-pointer"
              >
                Cancel
              </button>

              {/* Apply Crop Button */}
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    Cropping...
                  </>
                ) : isMulti && currentIndex + 1 < fileList.length ? (
                  <>
                    Crop & Next ({currentIndex + 2}/{fileList.length})
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Apply Crop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
