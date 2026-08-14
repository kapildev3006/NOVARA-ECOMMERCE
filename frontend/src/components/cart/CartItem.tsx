"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { mockProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";

interface CartItemProps {
  productId: string;
  quantity: number;
}

export function CartItem({ productId, quantity }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const product = mockProducts.find((p) => p.id === productId);

  if (!product) return null;

  const handleDecrease = () => {
    if (quantity > 1) {
      updateQuantity(productId, quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < product.stock) {
      updateQuantity(productId, quantity + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface rounded-2xl border border-black/5">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-white rounded-xl overflow-hidden flex items-center justify-center p-2">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain mix-blend-multiply p-2"
          sizes="(max-width: 768px) 96px, 128px"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between gap-4 items-start mb-1">
          <Link href={`/product/${product.slug}`} className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
            <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <button
            onClick={() => removeFromCart(productId)}
            className="text-muted hover:text-red-500 transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Remove item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">
          {product.category}
        </p>

        {/* Pricing */}
        <div className="flex flex-col gap-0.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted line-through font-medium">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.discount && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                {product.discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Controls & Stock */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center border border-black/10 rounded-lg h-9 bg-white w-28 shrink-0">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="w-8 h-full flex items-center justify-center text-foreground hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-l-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1 text-center font-semibold text-sm">
              {quantity}
            </div>
            <button
              onClick={handleIncrease}
              disabled={quantity >= product.stock}
              className="w-8 h-full flex items-center justify-center text-foreground hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-r-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {product.stock <= 10 && product.stock > 0 && (
            <span className="text-xs font-semibold text-orange-500">
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
