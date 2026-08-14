import { Address } from "./address";

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

export type OrderStatus = "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  address: Address;
  deliveryMethod: DeliveryMethod;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
}
