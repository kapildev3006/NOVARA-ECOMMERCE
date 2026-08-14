import Image from "next/image";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { Edit2, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminProductRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function AdminProductRow({ product, onEdit, onDelete }: AdminProductRowProps) {
  const getStockStatus = () => {
    if (product.stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (product.stock <= 10) return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  const status = getStockStatus();

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-[#e5e5e5] last:border-0 group">
      {/* Product */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl bg-[#FAFAF8] border border-black/5 overflow-hidden shrink-0">
            <Image 
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-1.5"
              sizes="48px"
            />
          </div>
          <div className="flex flex-col min-w-[150px]">
            <span className="font-bold text-[#161513] text-sm line-clamp-2 leading-tight mb-1">
              {product.name}
            </span>
            <span className="text-xs font-semibold text-gray-400">
              ID: {product.id}
            </span>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700">
          {product.category}
        </span>
      </td>

      {/* Price */}
      <td className="px-6 py-4 font-bold text-[#161513]">
        {formatPrice(product.price)}
      </td>

      {/* Stock & Status */}
      <td className="px-6 py-4">
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-sm font-bold text-[#161513]">{product.stock} units</span>
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide", status.color)}>
            {status.label}
          </span>
        </div>
      </td>

      {/* Rating */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm font-bold text-[#161513]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {product.rating}
          </div>
          <span className="text-xs font-medium text-gray-500">
            {product.reviewCount} revs
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Edit ${product.name}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
