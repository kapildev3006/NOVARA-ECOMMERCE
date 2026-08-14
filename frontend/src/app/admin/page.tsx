"use client";
import { formatPrice } from "@/lib/utils";

import { Calendar, ChevronDown, ShoppingBag, DollarSign, Users, Package, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { SalesChart } from "@/components/admin/SalesChart";
import { OrderStatusChart } from "@/components/admin/OrderStatusChart";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { LowStockAlert } from "@/components/admin/LowStockAlert";
import { AdminFooter } from "@/components/admin/AdminFooter";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 pt-4">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        
        {/* Date Selector */}
        <button className="flex items-center gap-2 bg-white border border-[#e5e5e5] rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] shadow-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          May 20 – May 26, 2024
          <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
        </button>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Orders"
          value="256"
          growth="↑ 18.2%"
          growthText="vs last week"
          icon={ShoppingBag}
          iconColorClass="text-[#ff4b2b]"
          iconBgClass="bg-[#ff4b2b]/10"
          trendColorClass="text-green-500"
        />
        <StatCard
          title="Total Sales"
          value={formatPrice(1245680)}
          growth="↑ 22.5%"
          growthText="vs last week"
          icon={DollarSign}
          iconColorClass="text-green-600"
          iconBgClass="bg-green-100"
          trendColorClass="text-green-500"
        />
        <StatCard
          title="Total Customers"
          value="1,248"
          growth="↑ 15.3%"
          growthText="vs last week"
          icon={Users}
          iconColorClass="text-blue-600"
          iconBgClass="bg-blue-100"
          trendColorClass="text-green-500"
        />
        <StatCard
          title="Total Products"
          value="342"
          growth="↑ 8.7%"
          growthText="vs last week"
          icon={Package}
          iconColorClass="text-purple-600"
          iconBgClass="bg-purple-100"
          trendColorClass="text-green-500"
        />
        <StatCard
          title="Low Stock Items"
          value="18"
          growth="↑ 5"
          growthText="vs last week"
          icon={AlertTriangle}
          iconColorClass="text-amber-500"
          iconBgClass="bg-amber-100"
          trendColorClass="text-[#ff4b2b]"
        />
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[400px]">
          <SalesChart />
        </div>
        <div className="min-h-[400px]">
          <OrderStatusChart />
        </div>
      </div>

      {/* Bottom Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[300px]">
          <RecentOrders />
        </div>
        <div className="min-h-[300px]">
          <LowStockAlert />
        </div>
      </div>

      <AdminFooter />
    </div>
  );
}
