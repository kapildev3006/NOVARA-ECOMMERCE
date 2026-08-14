"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, User, MapPin, Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", label: "Account Overview", icon: LayoutDashboard },
  { href: "/orders", label: "My Orders", icon: Package },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-4 scrollbar-hide snap-x">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap text-sm font-semibold transition-colors snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-surface text-foreground hover:bg-black/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Desktop: Vertical list */}
      <div className="hidden md:flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-background" : "text-muted")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
