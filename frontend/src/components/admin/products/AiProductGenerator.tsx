"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Sparkles, X, CheckCircle2 } from "lucide-react";
import { Category } from "@/types/category";
import { Product } from "@/types/product";
import { getAdminCategories } from "@/lib/admin-category-store";
import { formatPrice } from "@/lib/utils";

interface AiProductGeneratorProps {
  onApply: (productData: Partial<Product>) => void;
  onCancel: () => void;
}

export function AiProductGenerator({ onApply, onCancel }: AiProductGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [brandStyle, setBrandStyle] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(getAdminCategories());
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please provide a product idea first.");
      return;
    }

    if (prompt.length > 2000) {
      setError("Prompt is too long. Please keep it under 2000 characters.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          targetPrice,
          brandStyle,
          additionalInstructions,
          validCategories: categories.map(c => ({ name: c.name }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate product");
      }

      setGeneratedResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (generatedResult) {
    return (
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E5C4F]/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#1E5C4F]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">AI Generated Product</h2>
              <p className="text-sm text-muted">Review the drafted details below</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-surface rounded-xl p-5 mb-6 text-sm flex flex-col gap-4 border border-black/5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Name</span>
              <p className="font-medium">{generatedResult.name}</p>
            </div>
            <div>
              <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Category</span>
              <p className="font-medium">{generatedResult.category}</p>
            </div>
          </div>
          
          <div>
            <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Description</span>
            <p className="text-muted line-clamp-3">{generatedResult.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-white p-3 rounded-lg border border-black/5">
            <div>
              <span className="block text-xs font-bold text-[#FF5A36] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Suggested
              </span>
              <p className="font-bold">{formatPrice(generatedResult.price || 0)}</p>
            </div>
            <div>
              <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Original</span>
              <p className="font-medium line-through text-muted/70">{formatPrice(generatedResult.originalPrice || 0)}</p>
            </div>
            <div>
              <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Stock</span>
              <p className="font-medium">{generatedResult.stock} units</p>
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Specifications</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(generatedResult.specifications || {}).map(([key, val]) => (
                <span key={key} className="bg-white border border-black/5 px-2 py-1 rounded text-xs font-medium">
                  {key}: <span className="text-muted">{val as string}</span>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
             {generatedResult.isNew && <span className="text-xs bg-[#1E5C4F]/10 text-[#1E5C4F] px-2 py-1 rounded-md font-bold">New Arrival</span>}
             {generatedResult.isBestSeller && <span className="text-xs bg-[#FF5A36]/10 text-[#FF5A36] px-2 py-1 rounded-md font-bold">Best Seller</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel} className="text-sm">Cancel</Button>
          <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="text-sm gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Regenerate
          </Button>
          <Button onClick={() => onApply(generatedResult)} className="text-sm shadow-md">Apply to Form</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF5A36]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#FF5A36]" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-foreground">Generate with Gemini</h2>
            <p className="text-sm text-muted">Describe a product and let AI draft the metadata.</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-black">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Product Idea <span className="text-red-500">*</span></label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="Premium wireless ANC headphones, black, over-ear, 40-hour battery, Bluetooth 5.3, target price around ₹7,000"
            className="w-full h-28 px-4 py-3 bg-surface border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF5A36] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-1">Target Price <span className="font-normal text-muted text-xs">(Optional)</span></label>
            <input
              type="text"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. ₹4,999"
              className="w-full px-4 h-11 bg-surface border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF5A36]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-1">Brand / Style <span className="font-normal text-muted text-xs">(Optional)</span></label>
            <input
              type="text"
              value={brandStyle}
              onChange={(e) => setBrandStyle(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. Minimalist, Pro Series"
              className="w-full px-4 h-11 bg-surface border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF5A36]"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-foreground mb-1">Additional Instructions <span className="font-normal text-muted text-xs">(Optional)</span></label>
          <input
            type="text"
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. Emphasize noise cancellation, keep description under 50 words"
            className="w-full px-4 h-11 bg-surface border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF5A36]"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-black/5">
        <Button variant="ghost" onClick={onCancel} disabled={isGenerating}>Cancel</Button>
        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2 shadow-md">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? "Generating product..." : "Generate Product"}
        </Button>
      </div>
    </div>
  );
}
