import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, X, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImage, removeImage } from "@/lib/media/media-storage";
import { UploadedImage } from "@/types/media";

interface MultiImageUploaderProps {
  value?: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  label?: string;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  error?: string;
}

export function MultiImageUploader({
  value = [],
  onChange,
  label = "Images",
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  accept = "image/png, image/jpeg, image/jpg, image/webp",
  error
}: MultiImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(value || []);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Drag and drop state for reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external value
  useEffect(() => {
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImages(value);
    }
  }, [value]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: File[]) => {
    setLocalError(null);
    
    if (images.length + files.length > maxFiles) {
      setLocalError(`You can only upload up to ${maxFiles} images.`);
      return;
    }

    const validTypes = accept.split(",").map(t => t.trim());
    const validFiles = files.filter(f => validTypes.includes(f.type) && f.size <= maxSize);
    
    if (validFiles.length !== files.length) {
      setLocalError(`Some files were skipped. Ensure they are valid types and under ${Math.round(maxSize / (1024 * 1024))}MB.`);
    }
    
    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedImages: UploadedImage[] = [];
      for (const file of validFiles) {
        const uploaded = await uploadImage(file);
        uploadedImages.push(uploaded);
      }
      
      const newImages = [...images, ...uploadedImages];
      setImages(newImages);
      onChange(newImages);
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError("Failed to upload some images.");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [images, maxFiles, accept, maxSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleRemove = async (index: number) => {
    try {
      const imageToRemove = images[index];
      await removeImage(imageToRemove);
      
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
      onChange(newImages);
    } catch (err) {
      console.error("Failed to remove image", err);
    }
  };

  // Reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setImages(newImages);
    onChange(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const displayError = localError || error;
  const canUpload = images.length < maxFiles;

  return (
    <div className="w-full flex flex-col gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        multiple
        className="hidden"
        aria-hidden="true"
        disabled={!canUpload || isUploading}
      />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((img, index) => (
            <div 
              key={img.publicId || index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "relative group w-24 h-24 rounded-lg border border-[#e5e5e5] bg-gray-50 overflow-hidden cursor-move transition-transform duration-200",
                draggedIndex === index ? "opacity-50 scale-95" : "opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={img.url} 
                alt={`${label} ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                <div className="flex justify-between items-center w-full">
                  <div className="p-1 bg-white/20 rounded cursor-move text-white">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                    className="p-1 bg-red-500/90 text-white rounded hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {canUpload && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
              aria-label="Add image"
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500">Upload</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {images.length === 0 && (
        <div
          role="button"
          tabIndex={isUploading ? -1 : 0}
          onClick={() => { if(!isUploading) fileInputRef.current?.click() }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-disabled={isUploading}
          className={cn(
            "w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 px-6 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] focus-visible:ring-offset-2",
            isDragging
              ? "border-[#ff4b2b] bg-[#ff4b2b]/5"
              : displayError 
              ? "border-red-300 bg-red-50 hover:bg-red-100/50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100/50",
            isUploading && "opacity-70 cursor-not-allowed border-gray-200"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors",
            isDragging ? "bg-[#ff4b2b]/10 text-[#ff4b2b]" : "bg-white text-gray-400 shadow-sm border border-gray-100"
          )}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          
          <p className="text-sm font-bold text-[#161513] mb-1">
            Upload {label}
          </p>
          <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Max {maxFiles} files &middot; {Math.round(maxSize / (1024 * 1024))}MB each
          </p>
        </div>
      )}

      {displayError && <p className="text-red-500 text-xs font-bold" role="alert">{displayError}</p>}
    </div>
  );
}
