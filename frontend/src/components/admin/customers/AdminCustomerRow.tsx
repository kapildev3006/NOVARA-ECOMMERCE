import { AdminCustomer } from "@/types/customer";
import { Eye, Power } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface AdminCustomerRowProps {
  customer: AdminCustomer;
  onView: (customer: AdminCustomer) => void;
  onToggleStatus: (customer: AdminCustomer) => void;
}

export function AdminCustomerRow({ customer, onView, onToggleStatus }: AdminCustomerRowProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const isActive = customer.status === "Active";

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-[#e5e5e5] last:border-0 group">
      
      {/* Customer Avatar & Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            {getInitials(customer.name)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#161513] text-sm">
              {customer.name}
            </span>
            <span className="text-xs font-medium text-gray-500 truncate max-w-[150px]">
              {customer.email || "Email not available"}
            </span>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-gray-600">
          {customer.phone}
        </span>
      </td>

      {/* Orders Count */}
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-[#161513]">
          {customer.ordersCount}
        </span>
      </td>

      {/* Total Spent */}
      <td className="px-6 py-4">
        <span className="text-sm font-bold text-[#161513]">
          {formatPrice(customer.totalSpent)}
        </span>
      </td>
      
      {/* Last Order */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-gray-500">
          {formatDate(customer.lastOrderDate)}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {customer.status}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
          <button
            onClick={() => onView(customer)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleStatus(customer)}
            className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 ${
              isActive 
                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 focus-visible:ring-red-500' 
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50 focus-visible:ring-green-500'
            }`}
            title={isActive ? "Deactivate Customer" : "Activate Customer"}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
