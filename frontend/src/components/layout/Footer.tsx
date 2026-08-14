"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Footer() {
  return (
    <footer className="bg-background pt-16 pb-8 border-t border-black/5">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="font-heading font-bold text-2xl tracking-tight text-foreground inline-block mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
              NOVARA
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-sm mb-8">
              Discover a world of premium products curated for modern lifestyles. 
              From everyday essentials to cutting-edge technology, we bring you the best.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-6 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="flex flex-col gap-4 text-sm text-muted">
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">All Products</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">New Arrivals</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Best Sellers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Deals</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Categories</Link></li>
            </ul>
          </div>

          {/* Customer Service & Company */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-6 text-sm uppercase tracking-wider">Customer Service</h4>
            <ul className="flex flex-col gap-4 text-sm text-muted mb-8">
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Contact</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Help Center</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Shipping</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Returns</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">FAQ</Link></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-6 text-sm uppercase tracking-wider">Company</h4>
            <ul className="flex flex-col gap-4 text-sm text-muted mb-8">
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">About NOVARA</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Blog</Link></li>
            </ul>
            
            <h4 className="font-heading font-bold text-foreground mb-6 text-sm uppercase tracking-wider mt-8">Newsletter</h4>
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted">Subscribe to our newsletter for updates and exclusive offers.</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="flex-1 bg-surface border-transparent rounded-lg h-10 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Button type="submit" size="sm" className="h-10">Subscribe</Button>
              </form>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>© 2026 NOVARA. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
