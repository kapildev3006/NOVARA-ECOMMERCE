import { Product } from "@/types/product";
import { Edit } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

interface AdminInventoryRowProps {
  product: Product;
  onUpdateStock: (product: Product) => void;
}

export function AdminInventoryRow({ product, onUpdateStock }: AdminInventoryRowProps) {
  
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (stock <= 10) return { label: "Low Stock", color: "bg-orange-100 text-orange-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  const status = getStockStatus(product.stock);

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-[#e5e5e5] last:border-0 group">
      
      {/* Product Image & Name */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg bg-white border border-[#e5e5e5] overflow-hidden shrink-0">
            <Image 
              src={product.image} 
              alt={product.name} 
              fill 
              className="object-contain p-1"
            />
          </div>
          <span className="font-bold text-[#161513] text-sm truncate max-w-[200px]" title={product.name}>
            {product.name}
          </span>
        </div>
      </td>

      {/* Category */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-gray-500">
          {product.category}
        </span>
      </td>

      {/* SKU / ID */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-gray-400">
          {product.id}
        </span>
      </td>

      {/* Current Stock */}
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-[#161513]">
          {product.stock}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${status.color}`}>
          {status.label}
        </span>
      </td>

      {/* Price */}
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-[#161513]">
          {formatPrice(product.price)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            onClick={() => onUpdateStock(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 border border-[#e5e5e5] hover:bg-white hover:border-[#ff4b2b] hover:text-[#ff4b2b] rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
          >
            <Edit className="w-3.5 h-3.5" />
            Update
          </button>
        </div>
      </td>
    </tr>
  );
}
