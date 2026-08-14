import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/media/media-storage";
import { UploadedImage } from "@/types/media";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string, image?: UploadedImage) => void;
  label?: string;
  maxSize?: number;
  accept?: string;
  error?: string;
  isCircle?: boolean;
  className?: string;
}

export function ImageUploader({ 
  value, 
  onChange, 
  label = "Upload Image",
  maxSize = 5 * 1024 * 1024,
  accept = "image/png, image/jpeg, image/jpg, image/webp",
  error,
  isCircle = false,
  className = "",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. initial load or form reset)
  useEffect(() => {
    if (value !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewUrl(value);
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

  const validateAndProcessFile = async (file: File) => {
    setLocalError(null);

    const validTypes = accept.split(",").map(t => t.trim());
    if (!validTypes.includes(file.type)) {
      setLocalError(`Please upload a valid image (${validTypes.map(t => t.split('/')[1]?.toUpperCase()).join(', ')}).`);
      return;
    }

    if (file.size > maxSize) {
      setLocalError(`Image must be smaller than ${Math.round(maxSize / (1024 * 1024))}MB.`);
      return;
    }

    setIsUploading(true);

    // Fast preview using object URL
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    try {
      // Process through abstraction
      const uploaded = await uploadImage(file);
      
      // We successfully uploaded, revoke temp URL and use the persistent one
      URL.revokeObjectURL(tempUrl);
      setPreviewUrl(uploaded.url);
      onChange(uploaded.url, uploaded);
    } catch (err) {
      // Revert preview on failure
      URL.revokeObjectURL(tempUrl);
      setPreviewUrl(value || null);
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError("Failed to upload image.");
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
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, [accept, maxSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Revoke object URL if it exists to prevent memory leaks
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setPreviewUrl(null);
    setLocalError(null);
    onChange("", undefined);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerSelect = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayError = localError || error;

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        className="hidden"
        aria-hidden="true"
        disabled={isUploading}
      />

      {previewUrl ? (
        <div className={cn("flex flex-col gap-3", className)}>
          <div className={cn(
            "rounded-xl border border-[#e5e5e5] bg-gray-50 overflow-hidden flex flex-col relative group",
            isCircle ? "w-32 h-32 rounded-full mx-auto" : "w-full max-w-sm"
          )}>
            <div className={cn("w-full flex items-center justify-center bg-gray-100 relative", isCircle ? "h-full p-2" : "h-40 p-4")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={label}
                className={cn("max-w-full max-h-full object-contain transition-opacity", isUploading ? "opacity-40" : "opacity-100", isCircle && "rounded-full object-cover")}
              />
              
              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40">
                  <Loader2 className="w-8 h-8 text-[#ff4b2b] animate-spin mb-2" />
                  <span className="text-sm font-bold text-gray-700">Processing...</span>
                </div>
              )}
            </div>
            
            {!isUploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={triggerSelect}
                  className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
                  aria-label={`Replace ${label}`}
                >
                  <RefreshCw className="w-4 h-4" /> Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label={`Remove ${label}`}
                >
                  <X className="w-4 h-4" /> Remove
                </button>
              </div>
            )}
          </div>
          {displayError && <p className="text-red-500 text-xs font-bold" role="alert">{displayError}</p>}
        </div>
      ) : (
        <div className={cn("flex flex-col gap-2", className)}>
          <div
            role="button"
            tabIndex={isUploading ? -1 : 0}
            onClick={triggerSelect}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                triggerSelect(e);
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-disabled={isUploading}
            aria-label={`Upload ${label}`}
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
              <ImageIcon className="w-3.5 h-3.5" /> {accept.split(',').map(s=>s.split('/')[1]?.toUpperCase()).join(', ')} &middot; Max {Math.round(maxSize / (1024 * 1024))}MB
            </p>
          </div>
          {displayError && <p className="text-red-500 text-xs font-bold" role="alert">{displayError}</p>}
        </div>
      )}
    </div>
  );
}
