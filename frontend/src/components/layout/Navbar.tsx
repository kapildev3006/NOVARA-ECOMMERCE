"use client";

import Link from "next/link";
import { Search, Heart, ShoppingCart, MapPin, User } from "lucide-react";
import { CategoryNavigation } from "@/components/navigation/CategoryNavigation";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { mockCategories } from "@/data/categories";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const { cartCount, subtotal, isHydrated: cartHydrated } = useCart();
  const { wishlistCount, isHydrated: wishlistHydrated } = useWishlist();
  
  const isHydrated = cartHydrated && wishlistHydrated;

  return (
    <header 
      className="sticky top-0 z-40 w-full bg-background border-b border-black/5 shadow-sm"
    >
      {/* Desktop Row 1: Utility */}
      <div className="hidden md:block border-b border-black/5 bg-surface/30">
        <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 h-10 flex items-center justify-between text-xs font-medium text-muted">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">About NOVARA</Link>
            <Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Contact</Link>
            <Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Help Center</Link>
          </div>
          <div className="flex items-center gap-2 hover:text-foreground cursor-pointer transition-colors group">
            <MapPin className="w-3.5 h-3.5 text-primary group-hover:animate-bounce" />
            <span>Deliver to New York 10001</span>
          </div>
        </div>
      </div>

      {/* Main Navbar Row */}
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 h-20 md:h-24 flex items-center justify-between gap-4 md:gap-12">
        
        {/* Mobile Left: Hamburger + Logo */}
        <div className="flex items-center gap-4 md:w-1/4">
          <MobileMenu />
          <Link href="/" className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
            NOVARA
          </Link>
        </div>

        {/* Desktop Search (Hidden on Mobile) */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const q = formData.get("q")?.toString().trim();
            if (q) router.push(`/products?q=${encodeURIComponent(q)}`);
          }}
          className="hidden md:flex flex-1 max-w-2xl relative group"
        >
          <input 
            name="q"
            type="text" 
            placeholder="Search for products, brands and more..." 
            className="w-full bg-surface border-transparent rounded-xl h-14 pl-5 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-sm"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-lg hover:bg-[#e04f2f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {/* Desktop/Mobile Right: Actions */}
        <div className="flex items-center justify-end gap-3 md:gap-6 md:w-1/4">
          <Link href="/account" className="hidden md:flex items-center gap-2 p-2 text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <User className="w-6 h-6 md:w-7 md:h-7 stroke-[1.5]" />
            <span className="text-sm font-semibold hidden lg:block">Account</span>
          </Link>
          
          <Link href="/wishlist" className="p-2 text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg relative group">
            <Heart className="w-6 h-6 md:w-7 md:h-7 stroke-[1.5]" />
            {isHydrated && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-primary rounded-full border-2 border-background group-hover:border-surface transition-colors">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link href="/cart" className="flex items-center gap-2 p-2 text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg group">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 md:w-7 md:h-7 stroke-[1.5]" />
              {isHydrated && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 md:w-5 md:h-5 text-[10px] font-bold text-white bg-primary rounded-full border-2 border-background group-hover:border-surface transition-colors">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold hidden lg:block">
              {isHydrated && subtotal > 0 ? formatPrice(subtotal) : "$0.00"}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Search & Chips Row (Visible only on Mobile) */}
      <div className="md:hidden flex flex-col border-t border-black/5 bg-background">
        <form 
          className="p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const q = formData.get("q")?.toString().trim();
            if (q) router.push(`/products?q=${encodeURIComponent(q)}`);
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              name="q"
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-surface border-transparent rounded-lg h-12 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>
        
        {/* Mobile Horizontal Category Chips */}
        <div className="px-3 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Link href="/products" className="shrink-0 px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            All
          </Link>
          {mockCategories.map((category) => (
            <Link 
              key={category.id} 
              href={`/category/${category.slug}`}
              className="shrink-0 px-4 py-1.5 rounded-full bg-surface text-foreground text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Category Navigation */}
      <CategoryNavigation />
    </header>
  );
}
