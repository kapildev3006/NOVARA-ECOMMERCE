"use client";

import { useState, useEffect } from "react";
import { X, PackagePlus, Minus, Plus } from "lucide-react";
import { Product } from "@/types/product";

interface UpdateStockModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (productId: string, newStock: number) => void;
}

export function UpdateStockModal({ product, onClose, onSave }: UpdateStockModalProps) {
  const [stockInput, setStockInput] = useState<string>("0");

  useEffect(() => {
    if (product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStockInput(product.stock.toString());
    }
  }, [product]);

  if (!product) return null;

  const currentVal = parseInt(stockInput) || 0;

  const handleAdjust = (amount: number) => {
    const newVal = Math.max(0, currentVal + amount);
    setStockInput(newVal.toString());
  };

  const handleSave = () => {
    const finalVal = Math.max(0, parseInt(stockInput) || 0);
    onSave(product.id, finalVal);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (stock <= 10) return { label: "Low Stock", color: "bg-orange-100 text-orange-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  const status = getStockStatus(currentVal);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-sm w-full flex flex-col relative text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
          <PackagePlus className="w-8 h-8" />
        </div>
        
        <h3 className="font-heading font-bold text-xl text-[#161513] mb-1 truncate px-4" title={product.name}>
          Update Stock
        </h3>
        <p className="text-gray-500 text-xs mb-6 truncate px-4">
          {product.name}
        </p>

        <div className="mb-8">
          <label className="block text-sm font-bold text-[#161513] mb-3 text-left">
            Current Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAdjust(-1)}
              className="w-12 h-12 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
            >
              <Minus className="w-5 h-5" />
            </button>
            <input
              type="number"
              min="0"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              className="flex-1 h-12 text-center text-lg font-bold rounded-xl border border-[#e5e5e5] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
            />
            <button
              onClick={() => handleAdjust(1)}
              className="w-12 h-12 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">Predicted Status:</span>
            <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-[#ff4b2b] text-white font-bold py-2.5 rounded-xl hover:bg-[#ff3b1a] transition-colors"
          >
            Save Stock
          </button>
        </div>
      </div>
    </div>
  );
}
