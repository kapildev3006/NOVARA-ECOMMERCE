"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings,
  Store,
  Palette,
  Bell,
  Truck,
  Receipt,
  UserCircle
} from "lucide-react";

const SETTINGS_NAV = [
  { name: "General", href: "/admin/settings", icon: Settings, disabled: false },
  { name: "Store Information", href: "/admin/settings/store", icon: Store, disabled: false },
  { name: "Appearance", href: "/admin/settings/appearance", icon: Palette, disabled: false },
  { name: "Notifications", href: "/admin/settings/notifications", icon: Bell, disabled: false },
  { name: "Shipping", href: "/admin/settings/shipping", icon: Truck, disabled: false },
  { name: "Tax", href: "/admin/settings/tax", icon: Receipt, disabled: false },
  { name: "Admin Profile", href: "/admin/settings/profile", icon: UserCircle, disabled: false },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide shrink-0 md:w-64">
      {SETTINGS_NAV.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.disabled) {
          return (
            <div
              key={item.name}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-gray-400 bg-transparent cursor-not-allowed whitespace-nowrap opacity-60"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-3 hidden md:inline-block">
                Soon
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]",
              isActive
                ? "bg-[#ff4b2b]/10 text-[#ff4b2b]"
                : "text-gray-600 hover:bg-gray-100 hover:text-black"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#ff4b2b]" : "text-gray-500")} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
