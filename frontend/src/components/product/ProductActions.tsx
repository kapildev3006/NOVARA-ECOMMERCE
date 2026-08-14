"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  productId: string;
  stock: number;
}

export function ProductActions({ productId, stock }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  const isOutOfStock = stock === 0;

  const handleDecrease = () => setQuantity(prev => Math.max(1, prev - 1));
  const handleIncrease = () => setQuantity(prev => Math.min(stock, prev + 1));

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addToCart(productId, quantity);
    setIsAdded(true);
    
    // Temporary UI feedback, reverts after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(productId, quantity);
    router.push("/cart");
  };

  const stockStatusColor = isOutOfStock 
    ? "text-red-500" 
    : stock <= 10 
      ? "text-orange-500" 
      : "text-green-600";
      
  const stockStatusText = isOutOfStock
    ? "Out of Stock"
    : stock <= 10
      ? `Only ${stock} left in stock`
      : "In Stock";

  return (
    <div className="flex flex-col gap-6">
      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", isOutOfStock ? "bg-red-500" : stock <= 10 ? "bg-orange-500" : "bg-green-500")} />
        <span className={cn("text-sm font-bold", stockStatusColor)}>
          {stockStatusText}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Quantity Selector */}
        <div className="flex items-center border border-black/10 rounded-xl h-14 bg-surface/50 w-full sm:w-32 shrink-0">
          <button 
            onClick={handleDecrease}
            disabled={isOutOfStock || quantity <= 1}
            className="w-12 h-full flex items-center justify-center text-foreground hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-l-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <div className="flex-1 text-center font-semibold text-lg" aria-label={`Quantity: ${quantity}`}>
            {quantity}
          </div>
          
          <button 
            onClick={handleIncrease}
            disabled={isOutOfStock || quantity >= stock}
            className="w-12 h-full flex items-center justify-center text-foreground hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent rounded-r-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdded}
            className={cn(
              "flex-1 h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm",
              isAdded 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-surface border border-black/10 text-foreground hover:bg-black/5 hover:border-black/20",
              isOutOfStock && "opacity-50 cursor-not-allowed bg-black/5 text-muted hover:bg-black/5 hover:border-black/10"
            )}
          >
            {isAdded ? (
              <>
                <Check className="w-5 h-5" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 h-14 bg-primary hover:bg-[#e04f2f] text-white font-bold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-md"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
