"use client";

import { useEffect, useState } from "react";
import { getOrders } from "@/lib/order-utils";
import { Order } from "@/types/order";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Package, Heart, MapPin, ArrowRight } from "lucide-react";
import { Address } from "@/types/address";

interface Profile {
  fullName: string;
  email: string;
  phone?: string;
}

export default function AccountDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const { wishlistCount, isHydrated: wishlistHydrated } = useWishlist();

  useEffect(() => {
    try {
      const p = localStorage.getItem("novara-profile");
      if (p) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(JSON.parse(p));
      }

      const o = getOrders();
       
      setOrders(o);

      const a = localStorage.getItem("novara-addresses");
      if (a) {
        const parsed = JSON.parse(a) as Address[];
         
        setAddressCount(parsed.length);
      }
    } catch (e) {
      console.error(e);
    }
     
    setIsHydrated(true);
  }, []);

  if (!isHydrated || !wishlistHydrated) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-black/5 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-black/5 rounded-2xl" />
          <div className="h-32 bg-black/5 rounded-2xl" />
          <div className="h-32 bg-black/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-bold mb-1">
          Hello, {profile?.fullName || "Customer"}
        </h2>
        <p className="text-muted">Manage your orders, profile, and preferences here.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/orders" className="bg-surface border border-black/5 rounded-2xl p-6 hover:border-black/20 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Orders</h3>
          </div>
          <p className="text-muted font-medium text-sm">{orders.length} orders</p>
        </Link>
        
        <Link href="/wishlist" className="bg-surface border border-black/5 rounded-2xl p-6 hover:border-black/20 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Wishlist</h3>
          </div>
          <p className="text-muted font-medium text-sm">{wishlistCount} saved items</p>
        </Link>
        
        <Link href="/account/addresses" className="bg-surface border border-black/5 rounded-2xl p-6 hover:border-black/20 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Addresses</h3>
          </div>
          <p className="text-muted font-medium text-sm">{addressCount} saved addresses</p>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-heading text-xl">Recent Orders</h3>
          {orders.length > 0 && (
            <Link href="/orders" className="text-sm font-semibold text-primary flex items-center gap-1 hover:text-[#e04f2f]">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-surface border border-black/5 rounded-2xl p-8 text-center">
            <Package className="w-12 h-12 text-black/10 mx-auto mb-3" />
            <p className="font-bold mb-1">No orders yet</p>
            <p className="text-muted text-sm mb-4">Your recent orders will appear here.</p>
            <Link href="/products" className="text-sm font-bold bg-foreground text-background px-6 py-2.5 rounded-lg hover:bg-black/80 transition-colors inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="bg-white border border-black/10 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link href={`/orders/${order.id}`} className="font-bold text-foreground hover:text-primary transition-colors focus-visible:outline-none">
                    {order.id}
                  </Link>
                  <p className="text-sm text-muted mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                  <div className="text-left sm:text-right">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    <p className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-1">
                      {order.status}
                    </p>
                  </div>
                  <Link 
                    href={`/orders/${order.id}`}
                    className="shrink-0 font-semibold text-sm bg-surface hover:bg-black/5 px-4 py-2 rounded-lg transition-colors border border-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
