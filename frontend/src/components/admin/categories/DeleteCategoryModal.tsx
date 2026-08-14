"use client";

import { AlertTriangle, Info, X } from "lucide-react";
import { ExtendedCategory } from "./AdminCategoryRow";

interface DeleteCategoryModalProps {
  category: ExtendedCategory | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteCategoryModal({ category, onClose, onConfirm }: DeleteCategoryModalProps) {
  if (!category) return null;

  const hasProducts = category.productCount > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-sm w-full flex flex-col relative text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {hasProducts ? (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">Cannot delete category</h3>
            <p className="text-gray-500 text-sm mb-6">
              The category <strong>{category.name}</strong> contains {category.productCount} product(s). 
              Please reassign or delete those products first, or mark the category as inactive.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#161513] text-white font-bold py-2.5 rounded-xl hover:bg-black/80 transition-colors"
            >
              Okay
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">Delete Category?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete <strong>{category.name}</strong>? This action is temporary for this session.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
