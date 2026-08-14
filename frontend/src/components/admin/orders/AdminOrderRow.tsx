import { Order } from "@/types/order";
import { Eye, Edit } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface AdminOrderRowProps {
  order: Order;
  onView: (order: Order) => void;
  onUpdate: (order: Order) => void;
}

export function AdminOrderRow({ order, onView, onUpdate }: AdminOrderRowProps) {
  
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Placed": return "bg-blue-100 text-blue-700";
      case "Processing": return "bg-purple-100 text-purple-700";
      case "Shipped": return "bg-orange-100 text-orange-700";
      case "Delivered": return "bg-green-100 text-green-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-[#e5e5e5] last:border-0 group">
      
      {/* Order ID */}
      <td className="px-6 py-4">
        <span className="font-bold text-[#161513] text-sm">
          {order.id}
        </span>
      </td>

      {/* Date */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-gray-500">
          {formatDate(order.createdAt)}
        </span>
      </td>

      {/* Customer */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#161513]">
            {order.address.fullName}
          </span>
          <span className="text-xs font-medium text-gray-500 truncate max-w-[150px]">
            {order.address.city}, {order.address.state}
          </span>
        </div>
      </td>

      {/* Total */}
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-[#161513]">
          {formatPrice(order.total)}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            onClick={() => onView(order)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`View Order ${order.id}`}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdate(order)}
            className="p-2 text-gray-400 hover:text-[#ff4b2b] hover:bg-[#ff4b2b]/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
            aria-label={`Update Status ${order.id}`}
            title="Update Status"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
