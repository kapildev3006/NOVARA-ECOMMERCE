"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { ExtendedCategory } from "./AdminCategoryRow";
import { Category } from "@/types/category";
import { checkCategorySlugUnique, generateCategoryId } from "@/lib/admin-category-store";
import { ImageUploader } from "@/components/admin/media/ImageUploader";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  category?: ExtendedCategory | null; // null if adding new
}

export function CategoryFormModal({ isOpen, onClose, onSave, category }: CategoryFormModalProps) {
  const isEditing = !!category;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Auto-generate slug from name if adding
  useEffect(() => {
    if (!isEditing && name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  }, [name, isEditing]);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(category.name);
         
        setSlug(category.slug);
         
        setDescription(category.description || "");
         
        setImage(category.image);
         
        setIsActive(category.isActive ?? true);
      } else {
         
        setName("");
         
        setSlug("");
         
        setDescription("");
         
        setImage("/images/categories/default.png");
         
        setIsActive(true);
      }
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSlugError("");

    if (!name.trim() || !slug.trim()) return;

    if (!checkCategorySlugUnique(slug.trim(), category?.id)) {
      setSlugError("A category with this slug already exists.");
      return;
    }

    onSave({
      id: category ? category.id : generateCategoryId(),
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      image,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-md w-full relative my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading font-bold text-xl text-[#161513] mb-6">
          {isEditing ? "Edit Category" : "Add New Category"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-1.5">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
              placeholder="e.g. Smart Watches"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-1.5">Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugError("");
              }}
              className={`w-full h-10 px-3 rounded-xl border ${slugError ? 'border-red-500' : 'border-[#e5e5e5]'} bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]`}
              placeholder="e.g. smart-watches"
            />
            {slugError && <p className="text-red-500 text-xs font-bold mt-1">{slugError}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] min-h-[80px]"
              placeholder="Short description..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-1.5">Category Image</label>
            <ImageUploader
              value={image}
              label="Category Image"
              onChange={(url) => setImage(url)}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer py-2">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center peer-checked:bg-[#ff4b2b] peer-checked:border-[#ff4b2b] transition-colors">
                <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
              </div>
            </div>
            <span className="text-sm font-bold text-[#161513]">Active</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#ff4b2b] text-white font-bold py-2.5 rounded-xl hover:bg-[#ff3b1a] transition-colors"
            >
              Save Category
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
