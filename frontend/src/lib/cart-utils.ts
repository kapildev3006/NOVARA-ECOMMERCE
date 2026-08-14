import { CartItem } from "@/types/cart";
import { Product } from "@/types/product";

export function calculateCartTotals(cartItems: CartItem[], products: Product[]) {
  const { subtotal, originalSubtotal } = cartItems.reduce(
    (acc, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        acc.subtotal += product.price * item.quantity;
        acc.originalSubtotal += (product.originalPrice || product.price) * item.quantity;
      }
      return acc;
    },
    { subtotal: 0, originalSubtotal: 0 }
  );

  const discount = originalSubtotal - subtotal;
  
  return {
    subtotal: originalSubtotal,
    discount,
    subtotalAfterDiscount: subtotal,
  };
}
