"use client";

import { useState, useEffect, useMemo } from "react";
import { Order } from "@/types/order";
import { getOrders } from "@/lib/order-utils";
import { 
  DateRange, 
  getFilteredOrders, 
  getDashboardMetrics, 
  getTimeSeriesData,
  getRevenueByCategory,
  getStatusDistribution,
  getProductPerformance,
  getRecentSalesActivity
} from "@/lib/analytics-utils";
import { SimpleBarChart } from "@/components/admin/analytics/SimpleBarChart";
import { SimpleDonutChart } from "@/components/admin/analytics/SimpleDonutChart";
import { formatPrice } from "@/lib/utils";
import { Calendar, DollarSign, ShoppingBag, Users, Activity, TrendingUp, TrendingDown, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30 Days");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(getOrders());
     
    setIsHydrated(true);
  }, []);

  const filteredOrders = useMemo(() => getFilteredOrders(orders, dateRange), [orders, dateRange]);
  
  // Metrics
  const metrics = useMemo(() => getDashboardMetrics(filteredOrders), [filteredOrders]);
  const timeSeries = useMemo(() => getTimeSeriesData(filteredOrders, dateRange), [filteredOrders, dateRange]);
  const categoryRev = useMemo(() => getRevenueByCategory(filteredOrders).map(c => ({ label: c.category, value: c.revenue })), [filteredOrders]);
  const statusDist = useMemo(() => getStatusDistribution(filteredOrders).map(s => ({ label: s.status, value: s.count })), [filteredOrders]);
  
  const { top, lowest } = useMemo(() => getProductPerformance(filteredOrders), [filteredOrders]);
  const recentActivity = useMemo(() => getRecentSalesActivity(filteredOrders), [filteredOrders]);

  if (!isHydrated) return null;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">No analytics data yet</h3>
        <p className="text-gray-500 font-medium text-sm max-w-sm">
          Place your first simulated order to start seeing analytics.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="flex flex-col gap-6 pt-4 pb-12 relative max-w-[1400px]">
      
      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Track your store performance based on simulated orders.
          </p>
        </div>
        
        <div className="relative shrink-0">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-10 pl-9 pr-8 rounded-xl border border-[#e5e5e5] bg-white text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer w-full sm:w-auto"
            style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat' }}
          >
            <option value="7 Days">Last 7 Days</option>
            <option value="30 Days">Last 30 Days</option>
            <option value="90 Days">Last 90 Days</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#161513] truncate" title={formatPrice(metrics.totalRevenue)}>
            {formatPrice(metrics.totalRevenue)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orders</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#161513]">{metrics.totalOrders}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Order Value</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#161513] truncate" title={formatPrice(metrics.averageOrderValue || 0)}>
            {formatPrice(metrics.averageOrderValue || 0)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customers</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#161513]">{metrics.totalCustomers}</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <h3 className="font-bold text-[#161513] mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#ff4b2b]" />
            Sales Trend
          </h3>
          <SimpleBarChart data={timeSeries} metric="sales" />
        </div>

        {/* Orders Trend */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <h3 className="font-bold text-[#161513] mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Orders Trend
          </h3>
          <SimpleBarChart data={timeSeries} metric="orders" />
        </div>

        {/* Category Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <h3 className="font-bold text-[#161513] mb-6">Revenue by Category</h3>
          <div className="h-[250px]">
            <SimpleDonutChart data={categoryRev} metricType="currency" />
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <h3 className="font-bold text-[#161513] mb-6">Order Status Distribution</h3>
          <div className="h-[250px]">
            <SimpleDonutChart data={statusDist} metricType="number" />
          </div>
        </div>

      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="p-5 border-b border-[#e5e5e5]">
            <h3 className="font-bold text-[#161513] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Top Selling Products
            </h3>
          </div>
          <div className="p-2 flex-1">
            {top.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No products sold in this period</div>
            ) : (
              top.slice(0, 5).map(product => (
                <div key={product.productId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="relative w-10 h-10 rounded bg-gray-100 border border-[#e5e5e5] shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover rounded" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[#161513] text-sm truncate">{product.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#161513] text-sm">{formatPrice(product.revenue)}</p>
                    <p className="text-[10px] font-bold text-gray-500">{product.quantitySold} sold</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lowest Products */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="p-5 border-b border-[#e5e5e5]">
            <h3 className="font-bold text-[#161513] flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Lowest Selling Products
            </h3>
          </div>
          <div className="p-2 flex-1">
            {lowest.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No products sold in this period</div>
            ) : (
              lowest.slice(0, 5).map(product => (
                <div key={product.productId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="relative w-10 h-10 rounded bg-gray-100 border border-[#e5e5e5] shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover rounded" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-[#161513] text-sm truncate">{product.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#161513] text-sm">{formatPrice(product.revenue)}</p>
                    <p className="text-[10px] font-bold text-gray-500">{product.quantitySold} sold</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
          <div className="p-5 border-b border-[#e5e5e5] flex items-center justify-between">
            <h3 className="font-bold text-[#161513] flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Recent Activity
            </h3>
            <Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-wide text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-2 flex-1">
            {recentActivity.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No recent orders</div>
            ) : (
              recentActivity.map(order => (
                <div key={order.id} className="p-3 border-b border-[#e5e5e5] last:border-0 hover:bg-gray-50 transition-colors rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#161513] text-sm">{order.address.fullName}</span>
                    <span className="font-bold text-[#161513] text-sm">{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    <span>{order.id} &bull; {order.items.length} items</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
