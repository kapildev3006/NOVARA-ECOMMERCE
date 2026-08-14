"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  BarChart2, 
  Settings,
  PlusCircle,
  FolderPlus,
  Eye,
  Settings2,
  X,
  LineChart,
  LayoutTemplate
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Tags },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Inventory", href: "/admin/inventory", icon: BarChart2 },
  { name: "Analytics", href: "/admin/analytics", icon: LineChart },
  { name: "Homepage", href: "/admin/homepage", icon: LayoutTemplate },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const QUICK_ACTIONS = [
  { name: "Add New Product", href: "/admin/products/new", icon: PlusCircle, color: "text-[#ff4b2b]", bg: "bg-[#ff4b2b]/10" },
  { name: "Create Category", href: "/admin/categories", icon: FolderPlus, color: "text-green-600", bg: "bg-green-100" },
  { name: "View Orders", href: "/admin/orders", icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
  { name: "Manage Inventory", href: "/admin/inventory", icon: Settings2, color: "text-purple-600", bg: "bg-purple-100" },
];

export function AdminSidebar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white text-[#161513]">
      {/* Brand Header */}
      <div className="h-[64px] flex items-center justify-between px-6 shrink-0">
        <Link href="/admin" className="flex flex-col focus-visible:outline-none" onClick={onClose}>
          <span className="font-heading font-black text-2xl tracking-tight text-[#ff4b2b] leading-none mb-0.5">
            NOVARA
          </span>
          <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase leading-none">
            Admin Panel
          </span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-1 text-gray-500 hover:text-black">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        <nav className="space-y-1.5">
          {MAIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[15px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]",
                  isActive 
                    ? "bg-[#ff4b2b] text-white shadow-sm" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div>
          <hr className="border-[#e5e5e5] mb-6 mx-2" />
          <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-1.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
                >
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", action.bg)}>
                    <Icon className={cn("w-4 h-4", action.color)} />
                  </div>
                  {action.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 shrink-0 text-xs text-gray-400">
        <p className="font-semibold text-gray-500 mb-0.5">© 2024 NOVARA</p>
        <p>All rights reserved.</p>
      </div>
    </div>
  );
}
