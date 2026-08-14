"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { getAdminCategories } from "@/lib/admin-category-store";
import { saveAdminProduct, generateProductId, checkSlugUnique } from "@/lib/admin-product-store";
import { ImageUploader } from "@/components/admin/media/ImageUploader";
import { MultiImageUploader } from "@/components/admin/media/MultiImageUploader";
import { UploadedImage } from "@/types/media";
import { formatPrice, cn } from "@/lib/utils";
import { Check, Loader2, AlignLeft, DollarSign, Archive, ImageIcon, List, Settings, X, Plus } from "lucide-react";

interface ProductFormProps {
  initialData?: Product;
}

// Convert string[] to UploadedImage[]
const stringsToUploadImages = (urls?: string[]): UploadedImage[] => {
  if (!urls) return [];
  return urls.map(url => ({ url, publicId: url }));
};

// Convert Record<string, string> to array of key-value objects for the editor
const specToRows = (specs?: Record<string, string>) => {
  if (!specs) return [{ id: Date.now().toString(), key: "", value: "" }];
  const rows = Object.entries(specs).map(([key, value], i) => ({
    id: `${Date.now()}-${i}`,
    key,
    value
  }));
  return rows.length ? rows : [{ id: Date.now().toString(), key: "", value: "" }];
};

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  // Form States
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState(initialData?.category || "");
  const [description, setDescription] = useState(initialData?.description || "");
  
  const [price, setPrice] = useState(initialData?.price?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice?.toString() || "");
  const [discount, setDiscount] = useState(initialData?.discount?.toString() || "");
  
  const [stock, setStock] = useState(initialData?.stock?.toString() || "");
  
  const [image, setImage] = useState(initialData?.image || "");
  const [gallery, setGallery] = useState<UploadedImage[]>(stringsToUploadImages(initialData?.gallery));
  
  const [specRows, setSpecRows] = useState(specToRows(initialData?.specifications));
  
  const [isNew, setIsNew] = useState(initialData?.isNew ?? false);
  const [isBestSeller, setIsBestSeller] = useState(initialData?.isBestSeller ?? false);

  // Status & Validation
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(getAdminCategories());
  }, []);

  // Auto-slug logic
  useEffect(() => {
    if (!slugEdited && name) {
      const generated = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug(generated);
    }
  }, [name, slugEdited]);

  // Derived Pricing values
  const numPrice = Number(price);
  const numOriginal = Number(originalPrice);
  const calculatedDiscount = (numOriginal > 0 && numOriginal > numPrice) 
    ? Math.round(((numOriginal - numPrice) / numOriginal) * 100) 
    : 0;
    
  // Derived Stock Status
  const numStock = parseInt(stock, 10);
  let stockStatus = "Out of Stock";
  let stockColor = "text-red-500 bg-red-100";
  if (!isNaN(numStock)) {
    if (numStock > 10) {
      stockStatus = "In Stock";
      stockColor = "text-green-600 bg-green-100";
    } else if (numStock > 0) {
      stockStatus = "Low Stock";
      stockColor = "text-amber-600 bg-amber-100";
    }
  }

  // Handlers
  const handleAddSpecRow = () => {
    setSpecRows([...specRows, { id: Date.now().toString(), key: "", value: "" }]);
  };

  const handleRemoveSpecRow = (id: string) => {
    setSpecRows(specRows.filter(row => row.id !== id));
    if (specRows.length === 1) {
      setSpecRows([{ id: Date.now().toString(), key: "", value: "" }]);
    }
  };

  const updateSpecRow = (id: string, field: "key" | "value", val: string) => {
    setSpecRows(specRows.map(row => row.id === id ? { ...row, [field]: val } : row));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Product Name is required";
    if (!category) newErrors.category = "Category is required";
    if (!description.trim()) newErrors.description = "Description is required";
    
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = "Slug must be lowercase alphanumeric and dashes";
    }

    if (!price || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = "Valid price > 0 is required";
    }

    if (originalPrice && !isNaN(numOriginal)) {
      if (numOriginal < numPrice) {
        newErrors.originalPrice = "Original price cannot be lower than current price";
      }
    }

    const numDisc = Number(discount);
    if (discount && (isNaN(numDisc) || numDisc < 0 || numDisc > 100)) {
      newErrors.discount = "Discount must be between 0 and 100";
    }

    if (stock.trim() === "" || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      newErrors.stock = "Valid positive integer stock is required";
    }

    if (!image) {
      newErrors.image = "Main image is required";
    }
    
    // Check specs for empty keys/values if row is partially filled
    const invalidSpecs = specRows.some(row => (row.key && !row.value) || (!row.key && row.value));
    if (invalidSpecs) {
      newErrors.specifications = "Specification rows must have both Key and Value, or be empty";
    }
    
    // Check for duplicate keys
    const specKeys = specRows.filter(row => row.key.trim()).map(row => row.key.trim());
    if (new Set(specKeys).size !== specKeys.length) {
      newErrors.specifications = "Specification keys must be unique";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (!checkSlugUnique(slug, initialData?.id)) {
      setErrors(prev => ({ ...prev, slug: "A product with this slug already exists." }));
      const slugInput = document.querySelector('[name="slug"]') as HTMLElement;
      if (slugInput) slugInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSaving(true);
    
    // Clean up spec rows into Record
    const specs: Record<string, string> = {};
    specRows.forEach(row => {
      if (row.key.trim() && row.value.trim()) {
        specs[row.key.trim()] = row.value.trim();
      }
    });

    const productPayload: Product = {
      id: initialData?.id || generateProductId(),
      slug,
      name,
      category,
      description,
      price: numPrice,
      originalPrice: numOriginal > 0 ? numOriginal : undefined,
      discount: Number(discount) > 0 ? Number(discount) : undefined,
      stock: numStock,
      image,
      gallery: gallery.map(g => g.url),
      rating: initialData?.rating || 0,
      reviewCount: initialData?.reviewCount || 0,
      isNew,
      isBestSeller,
      specifications: Object.keys(specs).length > 0 ? specs : undefined
    };

    // Save to prototype store
    setTimeout(() => {
      saveAdminProduct(productPayload);
      setIsSaving(false);
      setSuccessMessage("Product saved successfully!");
      
      setTimeout(() => {
        router.push("/admin/products");
      }, 1000);
    }, 600);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 md:gap-8 max-w-5xl">
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-center gap-3 font-medium">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          {successMessage}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 border-b border-[#e5e5e5] flex items-center gap-3 bg-gray-50/50">
          <AlignLeft className="w-5 h-5 text-gray-500" />
          <h2 className="font-heading font-bold text-lg text-[#161513]">Basic Information</h2>
        </div>
        
        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Product Name <span className="text-[#ff4b2b]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NOVARA Smartphone Pro"
              className={cn("w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all", errors.name ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
              data-error={!!errors.name}
            />
            {errors.name && <p className="text-red-500 text-xs font-bold mt-2">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              URL Slug <span className="text-[#ff4b2b]">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              placeholder="e.g. novara-smartphone-pro"
              className={cn("w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all", errors.slug ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
              data-error={!!errors.slug}
            />
            {errors.slug && <p className="text-red-500 text-xs font-bold mt-2">{errors.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Category <span className="text-[#ff4b2b]">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn("w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all appearance-none", errors.category ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
              data-error={!!errors.category}
            >
              <option value="" disabled>Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs font-bold mt-2">{errors.category}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Description <span className="text-[#ff4b2b]">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product description..."
              className={cn("w-full p-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all min-h-[120px] resize-y", errors.description ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
              data-error={!!errors.description}
            />
            {errors.description && <p className="text-red-500 text-xs font-bold mt-2">{errors.description}</p>}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 border-b border-[#e5e5e5] flex items-center gap-3 bg-gray-50/50">
          <DollarSign className="w-5 h-5 text-gray-500" />
          <h2 className="font-heading font-bold text-lg text-[#161513]">Pricing</h2>
        </div>
        
        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Price (₹) <span className="text-[#ff4b2b]">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={cn("w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all", errors.price ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
              data-error={!!errors.price}
            />
            {errors.price && <p className="text-red-500 text-xs font-bold mt-2">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Original Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="0.00"
              className={cn("w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all", errors.originalPrice ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
              data-error={!!errors.originalPrice}
            />
            {errors.originalPrice && <p className="text-red-500 text-xs font-bold mt-2">{errors.originalPrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className={cn("w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all", errors.discount ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
              data-error={!!errors.discount}
            />
            {errors.discount && <p className="text-red-500 text-xs font-bold mt-2">{errors.discount}</p>}
          </div>

          {/* Pricing Preview */}
          <div className="md:col-span-3 bg-blue-50 rounded-xl p-4 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-1">Current Price</p>
              <p className="font-bold text-[#161513] text-lg">{formatPrice(numPrice || 0)}</p>
            </div>
            {numOriginal > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">Original Price</p>
                <p className="font-medium text-gray-500 line-through text-sm mt-1">{formatPrice(numOriginal)}</p>
              </div>
            )}
            {calculatedDiscount > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">Calculated Savings</p>
                <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                  {calculatedDiscount}% OFF
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory & Status */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 border-b border-[#e5e5e5] flex items-center gap-3 bg-gray-50/50">
          <Archive className="w-5 h-5 text-gray-500" />
          <h2 className="font-heading font-bold text-lg text-[#161513]">Inventory</h2>
        </div>
        
        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Stock Quantity <span className="text-[#ff4b2b]">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className={cn("w-full max-w-[200px] h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all", errors.stock ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]")}
                data-error={!!errors.stock}
              />
              {stock && !isNaN(numStock) && (
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap", stockColor)}>
                  {stockStatus}
                </span>
              )}
            </div>
            {errors.stock && <p className="text-red-500 text-xs font-bold mt-2">{errors.stock}</p>}
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 border-b border-[#e5e5e5] flex items-center gap-3 bg-gray-50/50">
          <ImageIcon className="w-5 h-5 text-gray-500" />
          <h2 className="font-heading font-bold text-lg text-[#161513]">Media</h2>
        </div>
        
        <div className="p-5 md:p-8 flex flex-col gap-8">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-3">
              Main Image <span className="text-[#ff4b2b]">*</span>
            </label>
            <div data-error={!!errors.image}>
              <ImageUploader 
                value={image} 
                onChange={(url) => setImage(url)} 
                label="Main Product Image"
              />
              {errors.image && <p className="text-red-500 text-xs font-bold mt-2">{errors.image}</p>}
            </div>
          </div>

          <hr className="border-[#e5e5e5]" />

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-3">
              Product Gallery
            </label>
            <p className="text-sm text-gray-500 mb-4 font-medium">Add supplementary images. You can drag and drop to reorder.</p>
            <MultiImageUploader 
              value={gallery}
              onChange={setGallery}
              label="Gallery Image"
              maxFiles={10}
            />
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 border-b border-[#e5e5e5] flex items-center gap-3 bg-gray-50/50">
          <List className="w-5 h-5 text-gray-500" />
          <h2 className="font-heading font-bold text-lg text-[#161513]">Specifications</h2>
        </div>
        
        <div className="p-5 md:p-8" data-error={!!errors.specifications}>
          <div className="flex flex-col gap-3">
            {specRows.map((row) => (
              <div key={row.id} className="flex items-start gap-3">
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => updateSpecRow(row.id, "key", e.target.value)}
                  placeholder="e.g. Display"
                  className="flex-1 max-w-[200px] h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => updateSpecRow(row.id, "value", e.target.value)}
                  placeholder="e.g. 6.7 inch AMOLED"
                  className="flex-1 h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpecRow(row.id)}
                  className="w-12 h-12 flex shrink-0 items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label="Remove specification row"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddSpecRow}
            className="mt-4 flex items-center gap-2 text-sm font-bold text-[#ff4b2b] hover:text-[#e03a1b] px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
          >
            <Plus className="w-4 h-4" /> Add Specification
          </button>
          
          {errors.specifications && <p className="text-red-500 text-xs font-bold mt-4">{errors.specifications}</p>}
        </div>
      </div>

      {/* Visibility Flags */}
      <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 border-b border-[#e5e5e5] flex items-center gap-3 bg-gray-50/50">
          <Settings className="w-5 h-5 text-gray-500" />
          <h2 className="font-heading font-bold text-lg text-[#161513]">Visibility & Badges</h2>
        </div>
        
        <div className="p-5 md:p-8 flex flex-col sm:flex-row gap-8">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ff4b2b]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4b2b]"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#161513]">New Product</p>
              <p className="text-xs font-medium text-gray-500">Adds the &quot;New&quot; badge</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ff4b2b]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4b2b]"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#161513]">Best Seller</p>
              <p className="text-xs font-medium text-gray-500">Adds the &quot;Best Seller&quot; badge</p>
            </div>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 pb-8">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          disabled={isSaving}
          className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center min-w-[140px] px-6 py-3 rounded-xl font-bold text-white bg-[#ff4b2b] hover:bg-[#e03a1b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? "Save Changes" : "Save Product")}
        </button>
      </div>

    </form>
  );
}
