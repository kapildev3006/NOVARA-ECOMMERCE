
import { cn, formatPrice } from "@/lib/utils";

const RECENT_ORDERS = [
  { id: "NVR-2024-0526-001", customer: "Rahul Sharma", amount: formatPrice(4999), status: "Delivered", date: "May 26, 2024" },
  { id: "NVR-2024-0526-002", customer: "Priya Patel", amount: formatPrice(2499), status: "Processing", date: "May 26, 2024" },
  { id: "NVR-2024-0526-003", customer: "Amit Kumar", amount: formatPrice(7999), status: "Shipped", date: "May 26, 2024" },
  { id: "NVR-2024-0525-001", customer: "Sneha Reddy", amount: formatPrice(1299), status: "Delivered", date: "May 25, 2024" },
  { id: "NVR-2024-0525-002", customer: "Vikram Singh", amount: formatPrice(3499), status: "Cancelled", date: "May 25, 2024" },
];

export function RecentOrders() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-100 text-green-700";
      case "Processing": return "bg-blue-100 text-blue-700";
      case "Shipped": return "bg-orange-100 text-orange-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5] overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-[#e5e5e5]">
        <h2 className="font-heading font-bold text-lg text-[#161513]">Recent Orders</h2>
        <button className="px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]">
          View All Orders
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#FAFAF8] text-gray-500 font-semibold border-b border-[#e5e5e5]">
            <tr>
              <th className="px-6 py-4 font-semibold">Order ID</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e5e5]">
            {RECENT_ORDERS.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-[#161513]">{order.id}</td>
                <td className="px-6 py-4 font-medium text-gray-600">{order.customer}</td>
                <td className="px-6 py-4 font-semibold text-[#161513]">{order.amount}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold",
                    getStatusColor(order.status)
                  )}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 font-medium">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
