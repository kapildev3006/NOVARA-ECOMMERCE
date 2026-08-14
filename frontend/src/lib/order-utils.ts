import { Order } from "@/types/order";

const ORDERS_KEY = "novara-orders";

export function saveOrder(order: Order): void {
  try {
    const existingOrders = getOrders();
    const updatedOrders = [order, ...existingOrders];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
  } catch (error) {
    console.error("Failed to save order", error);
  }
}

export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to get orders", error);
  }
  return [];
}

export function getOrderById(id: string): Order | undefined {
  const orders = getOrders();
  return orders.find(order => order.id === id);
}

export function generateOrderId(): string {
  const date = new Date();
  const dateString = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `NVR-${dateString}-${randomSuffix}`;
}

export function updateOrderStatus(orderId: string, status: Order["status"]): void {
  try {
    const orders = getOrders();
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to update order status", error);
  }
}
