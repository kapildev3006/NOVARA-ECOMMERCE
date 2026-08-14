import { Order } from "@/types/order";
import { mockProducts } from "@/data/products";

export type DateRange = "7 Days" | "30 Days" | "90 Days" | "All Time";

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  image: string;
  category: string;
  quantitySold: number;
  revenue: number;
}

export function getFilteredOrders(orders: Order[], range: DateRange): Order[] {
  if (range === "All Time") return orders;

  const now = new Date();
  const daysMap = {
    "7 Days": 7,
    "30 Days": 30,
    "90 Days": 90,
  };
  const daysToSubtract = daysMap[range];
  
  const cutoff = new Date();
  cutoff.setDate(now.getDate() - daysToSubtract);

  return orders.filter(order => new Date(order.createdAt) >= cutoff);
}

export function getDashboardMetrics(orders: Order[]): DashboardMetrics {
  if (orders.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
    };
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalRevenue / totalOrders;

  const uniqueCustomers = new Set<string>();
  orders.forEach(order => {
    // stable fallback if phone is missing
    const id = order.address?.phone || order.id;
    uniqueCustomers.add(id);
  });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalCustomers: uniqueCustomers.size,
  };
}

export function getTimeSeriesData(orders: Order[], range: DateRange): TimeSeriesDataPoint[] {
  if (orders.length === 0) return [];

  const grouped = new Map<string, { sales: number; orders: number }>();

  // Determine date bounds
  let startDate = new Date();
  const endDate = new Date();
  
  if (range !== "All Time") {
    const daysMap = { "7 Days": 7, "30 Days": 30, "90 Days": 90 };
    startDate.setDate(endDate.getDate() - daysMap[range as keyof typeof daysMap]);
  } else {
    // If all time, find the oldest order date
    const oldestDate = new Date(Math.min(...orders.map(o => new Date(o.createdAt).getTime())));
    startDate = oldestDate;
  }

  // Pre-fill zeros for the range to avoid missing dates
  // For 90 days or All Time, we might want to aggregate by week/month if we had too many, 
  // but day-by-day is fine for prototyping.
  // Let's limit pre-filling to 30 days to avoid huge arrays for "All Time" unless there's data.
  if (range === "7 Days" || range === "30 Days") {
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      grouped.set(dateStr, { sales: 0, orders: 0 });
    }
  }

  // Populate data
  orders.forEach(order => {
    const d = new Date(order.createdAt);
    const dateStr = d.toISOString().split('T')[0];
    
    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, { sales: 0, orders: 0 });
    }
    
    const curr = grouped.get(dateStr)!;
    curr.sales += order.total;
    curr.orders += 1;
  });

  // Convert map to sorted array
  return Array.from(grouped.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getRevenueByCategory(orders: Order[]): CategoryRevenue[] {
  const catMap = new Map<string, number>();

  orders.forEach(order => {
    order.items.forEach(item => {
      const product = mockProducts.find(p => p.id === item.productId);
      const catName = product ? product.category : "Unknown";
      
      const itemRev = item.price * item.quantity;
      catMap.set(catName, (catMap.get(catName) || 0) + itemRev);
    });
  });

  return Array.from(catMap.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function getStatusDistribution(orders: Order[]): StatusDistribution[] {
  const statusMap = new Map<string, number>();

  orders.forEach(order => {
    statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
  });

  return Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

export function getProductPerformance(orders: Order[]): { top: ProductPerformance[], lowest: ProductPerformance[] } {
  const perfMap = new Map<string, { quantitySold: number; revenue: number }>();

  orders.forEach(order => {
    order.items.forEach(item => {
      if (!perfMap.has(item.productId)) {
        perfMap.set(item.productId, { quantitySold: 0, revenue: 0 });
      }
      const curr = perfMap.get(item.productId)!;
      curr.quantitySold += item.quantity;
      curr.revenue += (item.price * item.quantity);
    });
  });

  const performances: ProductPerformance[] = Array.from(perfMap.entries()).map(([productId, data]) => {
    const product = mockProducts.find(p => p.id === productId);
    return {
      productId,
      name: product ? product.name : "Product no longer available",
      image: product ? product.image : "/placeholder.png", // safe fallback
      category: product ? product.category : "Unknown",
      quantitySold: data.quantitySold,
      revenue: data.revenue
    };
  });

  // Top Selling Products (descending)
  const top = [...performances].sort((a, b) => b.quantitySold - a.quantitySold);
  
  // Lowest Selling Products (ascending) - note: this only includes products that have sold at least 1 item in the filtered range
  const lowest = [...performances].sort((a, b) => a.quantitySold - b.quantitySold);

  return { top, lowest };
}

export function getRecentSalesActivity(orders: Order[], limit = 5): Order[] {
  return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}
