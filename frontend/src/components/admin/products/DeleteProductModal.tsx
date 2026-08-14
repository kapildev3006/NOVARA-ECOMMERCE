"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { X, AlertTriangle } from "lucide-react";
import { Product } from "@/types/product";

interface DeleteProductModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProductModal({ product, onClose, onConfirm }: DeleteProductModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Auto focus the cancel button on mount for safety
    cancelBtnRef.current?.focus();

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h2 id="modal-title" className="font-heading font-bold text-xl text-[#161513]">
              Delete Product?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#161513] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-gray-600 font-medium text-sm mb-4">
            This will remove <strong className="text-[#161513] font-bold">{product.name}</strong> from the admin catalog. This action cannot be undone.
          </p>

          <div className="flex items-center gap-4 bg-gray-50 border border-[#e5e5e5] rounded-xl p-3">
            <div className="relative w-12 h-12 rounded-lg bg-white border border-[#e5e5e5] overflow-hidden shrink-0">
              <Image 
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-1"
                sizes="48px"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[#161513] text-sm truncate">
                {product.name}
              </span>
              <span className="text-xs font-semibold text-gray-500">
                ID: {product.id}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#e5e5e5] bg-gray-50 flex flex-col-reverse sm:flex-row items-center gap-3 justify-end rounded-b-2xl">
          <button
            type="button"
            ref={cancelBtnRef}
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-white border border-[#e5e5e5] hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}
