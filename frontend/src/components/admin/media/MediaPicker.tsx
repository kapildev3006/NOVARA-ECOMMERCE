"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Upload, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { getMediaAssets, uploadMedia, deleteMediaAsset, MediaAssetData } from "@/lib/admin-media-api";
import { UploadedImage } from "@/types/media";
import { usePermissions } from "@/context/PermissionsContext";

interface MediaPickerProps {
  value?: string; // URL
  onChange: (url: string, image: UploadedImage) => void;
  standalone?: boolean; // If true, acts as a page/library rather than a picker
}

export function MediaPicker({ value, onChange, standalone = false }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(standalone);
  const [assets, setAssets] = useState<MediaAssetData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { can } = usePermissions();

  const loadAssets = useCallback(async (pageNum = 1, searchQuery = search) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getMediaAssets({ page: pageNum, limit: 20, search: searchQuery });
      if (pageNum === 1) {
        setAssets(res.assets);
      } else {
        setAssets(prev => [...prev, ...res.assets]);
      }
      setTotal(res.pagination.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAssets(1);
    }
  }, [isOpen, loadAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    try {
      setIsUploading(true);
      setError(null);
      const asset = await uploadMedia(file);
      setAssets(prev => [asset, ...prev]);
      setTotal(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = ""; // Reset input
    }
  };

  const handleDelete = async (assetKey: string) => {
    if (!confirm("Are you sure you want to delete this media asset?")) return;

    try {
      setIsLoading(true);
      setError(null);
      await deleteMediaAsset(assetKey);
      setAssets(prev => prev.filter(a => a.assetKey !== assetKey));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (asset: MediaAssetData) => {
    if (standalone) return; // Can't select in standalone mode
    onChange(asset.url, {
      url: asset.url,
      publicId: asset.publicId,
      width: asset.width,
      height: asset.height,
      format: asset.format,
      assetKey: asset.assetKey,
      altText: asset.altText,
    });
    setIsOpen(false);
  };

  const content = (
    <div className={`flex flex-col h-full bg-white ${!standalone && "p-6"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Media Library</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and select homepage assets</p>
        </div>
        {!standalone && (
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadAssets(1)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-[#ff4b2b] focus:ring-2 focus:ring-[#ff4b2b]/20 transition-all outline-none"
          />
        </div>
        {can("homepage.edit") && (
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={isUploading}
            />
            <button
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff4b2b] text-white text-sm font-semibold rounded-xl hover:bg-[#e63e20] transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-[400px]">
        {assets.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No media found</h3>
            <p className="text-sm text-gray-500">Upload an image to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {assets.map((asset) => {
              const isSelected = value === asset.url;
              return (
                <div
                  key={asset.assetKey}
                  className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected ? "border-[#ff4b2b]" : "border-gray-100 hover:border-gray-300"
                  }`}
                  onClick={() => handleSelect(asset)}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.altText || asset.assetKey}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#ff4b2b] text-white rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white flex items-center justify-between">
                    <div className="truncate">
                      <p className="text-xs font-medium text-gray-900 truncate" title={asset.publicId}>
                        {asset.format ? asset.format.toUpperCase() : "IMG"}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {asset.width && asset.height ? `${asset.width}x${asset.height}` : "Unknown dimensions"}
                      </p>
                    </div>
                    {can("homepage.edit") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.assetKey);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {assets.length < total && (
          <div className="mt-8 text-center">
            <button
              onClick={() => loadAssets(page + 1)}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <div>
      <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all ${
          value ? "border-transparent" : "border-gray-200 hover:border-[#ff4b2b] hover:bg-[#ff4b2b]/5"
        }`}>
          {value ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Selected media" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-medium text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Change Image
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[#ff4b2b] transition-colors p-6 text-center">
              <ImageIcon className="w-8 h-8" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Select an image</p>
                <p className="text-xs opacity-70">Browse Media Library</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
