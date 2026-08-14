"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { HomepageSection } from "@/types/homepage";
import { HomepageSectionRenderer } from "@/components/home/HomepageSectionRenderer";

interface HomepageSectionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  section: HomepageSection | null;
}

export function HomepageSectionPreview({ isOpen, onClose, section }: HomepageSectionPreviewProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when preview is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !section) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-heading"
    >
      {/* Header */}
      <div className="h-[64px] shrink-0 bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6">
        <div>
          <h2 id="preview-heading" className="font-heading font-bold text-xl text-[#161513]">
            Section Preview
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {section.title || section.type.replace("-", " ")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="bg-white min-h-full w-full relative">
          <HomepageSectionRenderer section={section} />
        </div>
      </div>
    </div>
  );
}
