"use client";

import React from "react";
import { MediaPicker } from "@/components/admin/media/MediaPicker";

export default function MediaLibraryPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] p-6 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <p className="text-gray-500 mt-1">
          Upload and manage images for the homepage
        </p>
      </div>
      
      <div className="flex-1 bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-180px)]">
        <MediaPicker 
          onChange={() => {}} 
          standalone={true} 
        />
      </div>
    </div>
  );
}
