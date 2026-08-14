import Image from "next/image";
import { Category } from "@/types/category";
import { Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExtendedCategory extends Category {
  productCount: number;
}

interface AdminCategoryRowProps {
  category: ExtendedCategory;
  onEdit: (category: ExtendedCategory) => void;
  onDelete: (category: ExtendedCategory) => void;
}

export function AdminCategoryRow({ category, onEdit, onDelete }: AdminCategoryRowProps) {
  const isActive = category.isActive ?? true;

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-[#e5e5e5] last:border-0 group">
      {/* Category */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl bg-[#FAFAF8] border border-black/5 overflow-hidden shrink-0">
            <Image 
              src={category.image}
              alt={category.name}
              fill
              className="object-contain p-1.5"
              sizes="48px"
            />
          </div>
          <div className="flex flex-col min-w-[150px]">
            <span className="font-bold text-[#161513] text-sm line-clamp-2 leading-tight mb-1">
              {category.name}
            </span>
            <span className="text-xs font-semibold text-gray-400">
              /{category.slug}
            </span>
          </div>
        </div>
      </td>

      {/* Description */}
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-gray-500 max-w-[200px] truncate">
          {category.description || "—"}
        </p>
      </td>

      {/* Products */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
          {category.productCount} products
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
          isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        )}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Edit ${category.name}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
