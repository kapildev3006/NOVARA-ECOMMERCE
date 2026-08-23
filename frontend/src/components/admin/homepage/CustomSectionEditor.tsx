"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Check, Search, AlertCircle } from "lucide-react";
import { HomepageSection, CustomSectionConfig } from "@/types/homepage";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { getAdminProducts } from "@/lib/admin-product-store";
import { getAdminCategories } from "@/lib/admin-category-store";
import { Product } from "@/types/product";
import { Category } from "@/types/category";

const BG_COLORS = ["#FFFFFF", "#FAFAF8", "#F3F4F6", "#161513", "#1E5C4F"];
const TEXT_COLORS = ["#161513", "#4B5563", "#FFFFFF", "#FF5A36"];

interface CustomSectionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  section: HomepageSection | null;
  onSave: (updatedSection: HomepageSection) => void;
}

export function CustomSectionEditor({ isOpen, onClose, section, onSave }: CustomSectionEditorProps) {
  // Internal
  const [internalName, setInternalName] = useState("");
  const [enabled, setEnabled] = useState(true);

  // Config
  const [layout, setLayout] = useState<CustomSectionConfig["layout"]>("image-left");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<CustomSectionConfig["image"]>(undefined);
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#FAFAF8");
  const [textColor, setTextColor] = useState("#161513");
  const [textAlign, setTextAlign] = useState<"left" | "center">("left");
  
  // Collections
  const [enableProducts, setEnableProducts] = useState(false);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [enableCategories, setEnableCategories] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  // State
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableProducts(getAdminProducts());
      setAvailableCategories(getAdminCategories());
      
      if (section && section.type === "custom") {
        setInternalName(section.title || "Custom Section");
        setEnabled(section.enabled);
        
        const config = section.config as CustomSectionConfig | undefined;
        setLayout(config?.layout || "image-left");
        setTitle(config?.title || "");
        setSubtitle(config?.subtitle || "");
        setDescription(config?.description || "");
        setImage(config?.image);
        setButtonText(config?.buttonText || "");
        setButtonLink(config?.buttonLink || "");
        setBackgroundColor(config?.backgroundColor || "#FAFAF8");
        setTextColor(config?.textColor || "#161513");
        setTextAlign(config?.textAlign || "left");

        setEnableProducts(Array.isArray(config?.productIds) && config!.productIds!.length > 0);
        setProductIds(config?.productIds || []);
        
        setEnableCategories(Array.isArray(config?.categoryIds) && config!.categoryIds!.length > 0);
        setCategoryIds(config?.categoryIds || []);
      }
    }
  }, [isOpen, section]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return availableProducts;
    const lower = productSearch.toLowerCase();
    return availableProducts.filter(p => p.name.toLowerCase().includes(lower));
  }, [productSearch, availableProducts]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return availableCategories;
    const lower = categorySearch.toLowerCase();
    return availableCategories.filter(c => c.name.toLowerCase().includes(lower));
  }, [categorySearch, availableCategories]);

  if (!isOpen || !section) return null;

  const validate = () => {
    if (!title.trim()) return "Title is required.";
    if (!image && (layout === "image-left" || layout === "image-right" || layout === "full-width-banner")) {
      return "Image is required for this layout.";
    }
    if (buttonText.trim()) {
      if (!buttonLink.trim()) return "Button link is required if button text is provided.";
      if (/^(javascript|data|vbscript):/i.test(buttonLink.trim())) {
        return "Invalid button link protocol.";
      }
    }
    if (enableProducts && productIds.length === 0) return "Select at least one product when Product Collection is enabled.";
    if (enableCategories && categoryIds.length === 0) return "Select at least one category when Category Collection is enabled.";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const config: CustomSectionConfig = {
      layout,
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      image,
      buttonText: buttonText.trim() || undefined,
      buttonLink: buttonLink.trim() || undefined,
      backgroundColor,
      textColor,
      textAlign,
      productIds: enableProducts ? productIds : undefined,
      categoryIds: enableCategories ? categoryIds : undefined,
    };

    onSave({
      ...section,
      title: internalName.trim() || "Custom Section",
      enabled,
      config,
    });
  };

  const toggleProduct = (id: string) => {
    setProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCategory = (id: string) => {
    setCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] max-w-2xl w-full flex flex-col max-h-[90vh] my-8 relative">
        
        {/* Header (sticky) */}
        <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5] shrink-0 sticky top-0 bg-white rounded-t-[16px] z-10">
          <div>
            <h3 className="font-heading font-bold text-2xl text-[#161513]">Custom Section Builder</h3>
            <p className="text-sm text-gray-500 font-medium">Design your own homepage section.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-lg p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form id="custom-section-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Meta */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Internal Setting</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#161513] mb-1.5">Admin Section Name</label>
                  <input
                    type="text"
                    value={internalName}
                    onChange={(e) => setInternalName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
                    placeholder="e.g. Summer Promo 2026"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-bold text-[#161513] mb-1.5">Visibility</label>
                  <label className="relative inline-flex items-center cursor-pointer h-10">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ff4b2b] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[8px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4b2b]"></div>
                    <span className="ml-3 text-sm font-bold text-[#161513]">{enabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Layout */}
            <div className="space-y-4 border-t border-[#e5e5e5] pt-6">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Layout & Design</h4>
              
              <div>
                <label className="block text-sm font-bold text-[#161513] mb-2">Layout Pattern</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "image-left", label: "Image Left" },
                    { value: "image-right", label: "Image Right" },
                    { value: "full-width-banner", label: "Full Width Banner" }
                  ].map(opt => (
                    <label key={opt.value} className={`border p-3 rounded-xl cursor-pointer text-center transition-colors ${layout === opt.value ? 'border-[#ff4b2b] bg-[#ff4b2b]/5' : 'border-[#e5e5e5] hover:bg-gray-50'}`}>
                      <input type="radio" name="layout" value={opt.value} checked={layout === opt.value} onChange={() => setLayout(opt.value as CustomSectionConfig["layout"])} className="hidden" />
                      <span className={`text-sm font-bold ${layout === opt.value ? 'text-[#ff4b2b]' : 'text-[#161513]'}`}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#161513] mb-2">Text Alignment</label>
                  <select value={textAlign} onChange={e => setTextAlign(e.target.value as "left" | "center")} className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#161513] mb-2">Background Color</label>
                  <div className="flex gap-2 h-10 items-center">
                    {BG_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setBackgroundColor(c)} className={`w-8 h-8 rounded-full border-2 ${backgroundColor === c ? 'border-[#ff4b2b] scale-110' : 'border-gray-200'} transition-transform`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#161513] mb-2">Text Color</label>
                  <div className="flex gap-2 h-10 items-center">
                    {TEXT_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setTextColor(c)} className={`w-8 h-8 rounded-full border-2 ${textColor === c ? 'border-[#ff4b2b] scale-110' : 'border-gray-200'} transition-transform`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-4 border-t border-[#e5e5e5] pt-6">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Media</h4>
              <MediaPicker value={image?.url} onChange={(url, img) => setImage(img)} />
            </div>

            {/* Content */}
            <div className="space-y-4 border-t border-[#e5e5e5] pt-6">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Content</h4>
              <div>
                <label className="block text-sm font-bold text-[#161513] mb-1.5">Title <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] text-sm focus-visible:ring-[#ff4b2b] focus-visible:outline-none focus-visible:ring-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#161513] mb-1.5">Subtitle</label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] text-sm focus-visible:ring-[#ff4b2b] focus-visible:outline-none focus-visible:ring-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#161513] mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 rounded-xl border border-[#e5e5e5] text-sm focus-visible:ring-[#ff4b2b] focus-visible:outline-none focus-visible:ring-2 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#161513] mb-1.5">Button Text</label>
                  <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="e.g. Shop Now" className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] text-sm focus-visible:ring-[#ff4b2b] focus-visible:outline-none focus-visible:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#161513] mb-1.5">Button Link</label>
                  <input type="text" value={buttonLink} onChange={e => setButtonLink(e.target.value)} placeholder="/products" className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] text-sm focus-visible:ring-[#ff4b2b] focus-visible:outline-none focus-visible:ring-2" />
                </div>
              </div>
            </div>

            {/* Optional Products */}
            <div className="space-y-4 border-t border-[#e5e5e5] pt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Product Collection</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={enableProducts} onChange={e => {
                    setEnableProducts(e.target.checked);
                    if (!e.target.checked) setProductIds([]);
                  }} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ff4b2b] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#161513]"></div>
                </label>
              </div>

              {enableProducts && (
                <div className="bg-gray-50 p-4 rounded-xl border border-[#e5e5e5]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[#161513]">Select Products</span>
                    <span className="text-xs font-bold bg-gray-200 px-2 py-0.5 rounded-full">{productIds.length} Selected</span>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search..." className="w-full h-10 pl-9 rounded-xl border border-[#e5e5e5] text-sm" />
                  </div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    {filteredProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="accent-[#ff4b2b] w-4 h-4" />
                        <span className="text-sm font-bold text-[#161513] truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Categories */}
            <div className="space-y-4 border-t border-[#e5e5e5] pt-6 pb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Category Collection</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={enableCategories} onChange={e => {
                    setEnableCategories(e.target.checked);
                    if (!e.target.checked) setCategoryIds([]);
                  }} />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ff4b2b] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#161513]"></div>
                </label>
              </div>

              {enableCategories && (
                <div className="bg-gray-50 p-4 rounded-xl border border-[#e5e5e5]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[#161513]">Select Categories</span>
                    <span className="text-xs font-bold bg-gray-200 px-2 py-0.5 rounded-full">{categoryIds.length} Selected</span>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search..." className="w-full h-10 pl-9 rounded-xl border border-[#e5e5e5] text-sm" />
                  </div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                    {filteredCategories.map(c => (
                      <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} className="accent-[#ff4b2b] w-4 h-4" />
                        <span className="text-sm font-bold text-[#161513] truncate">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </form>
        </div>

        {/* Footer (sticky) */}
        <div className="p-6 border-t border-[#e5e5e5] bg-white rounded-b-[16px] shrink-0">
          <button
            form="custom-section-form"
            type="submit"
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#161513] text-white font-bold rounded-xl hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
          >
            <Check className="w-5 h-5" />
            Apply Changes
          </button>
        </div>

      </div>
    </div>
  );
}
