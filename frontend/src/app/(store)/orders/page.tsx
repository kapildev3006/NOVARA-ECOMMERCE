"use client";

import { useEffect, useState, useMemo } from "react";
import { getOrders } from "@/lib/order-utils";
import { Order } from "@/types/order";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Search, Package, ArrowRight, Filter } from "lucide-react";
import { mockProducts } from "@/data/products";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Placed">("All");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrders(getOrders());
     
    setIsHydrated(true);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (statusFilter !== "All" && order.status !== statusFilter) return false;
        
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = order.id.toLowerCase().includes(q);
          const matchProduct = order.items.some(item => {
            const p = mockProducts.find(product => product.id === item.productId);
            return p?.name.toLowerCase().includes(q);
          });
          return matchId || matchProduct;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, statusFilter]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="mx-auto max-w-[800px] px-4 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-48 bg-black/5 rounded mb-8" />
            <div className="h-40 bg-black/5 rounded-2xl" />
            <div className="h-40 bg-black/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="mx-auto max-w-[800px] px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-1">
              My Orders
            </h1>
            <p className="text-muted text-sm">View and track your recent purchases.</p>
          </div>
          
          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 pr-4 bg-surface border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all w-full sm:w-64"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "All" | "Placed")}
                  className="h-10 pl-4 pr-8 bg-surface border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all appearance-none cursor-pointer w-full sm:w-auto font-medium text-foreground"
                >
                  <option value="All">All Statuses</option>
                  <option value="Placed">Placed</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-surface border border-black/5 rounded-3xl p-12 text-center">
            <Package className="w-16 h-16 text-black/10 mx-auto mb-4" />
            <h2 className="font-heading font-bold text-2xl mb-2">No orders yet</h2>
            <p className="text-muted max-w-md mx-auto mb-8">
              Your orders will appear here after you make a purchase.
            </p>
            <Link
              href="/products"
              className="bg-foreground text-background font-bold py-3 px-8 rounded-xl hover:bg-black/90 transition-colors inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-md hover:shadow-lg"
            >
              Start Shopping <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-surface border border-black/5 rounded-3xl p-12 text-center">
            <p className="font-bold mb-2">No matching orders found</p>
            <p className="text-muted text-sm mb-4">Try adjusting your search or filters.</p>
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
              className="text-primary font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredOrders.map((order) => {
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <div key={order.id} className="bg-white border border-black/10 rounded-2xl overflow-hidden hover:border-black/20 transition-all focus-within:ring-2 focus-within:ring-primary shadow-sm hover:shadow-md">
                  <div className="bg-surface p-4 sm:p-6 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="grid grid-cols-2 sm:flex sm:gap-8 gap-y-4 text-sm">
                      <div>
                        <p className="text-muted mb-1">Order Placed</p>
                        <p className="font-bold text-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Total</p>
                        <p className="font-bold text-foreground">{formatPrice(order.total)}</p>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Status</p>
                        <p className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block">
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-muted mb-1 text-sm">Order #</p>
                      <Link href={`/orders/${order.id}`} className="font-bold text-primary hover:underline focus-visible:outline-none">
                        {order.id}
                      </Link>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <p className="font-bold text-foreground mb-1">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</p>
                      <p className="text-sm text-muted">Includes: {
                        order.items.slice(0, 2).map(i => {
                          const p = mockProducts.find(product => product.id === i.productId);
                          return p?.name || "Unknown Product";
                        }).join(", ")
                      }{order.items.length > 2 && "..."}</p>
                    </div>
                    
                    <Link
                      href={`/orders/${order.id}`}
                      className="shrink-0 font-bold bg-white text-foreground border border-black/10 hover:bg-black/5 px-6 py-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full sm:w-auto text-center"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
