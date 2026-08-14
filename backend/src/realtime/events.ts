export interface SocketData {
  userId: string;
  role: "Customer" | "Admin" | "SuperAdmin";
}

export interface ClientToServerEvents {
  // Empty for now: clients are not allowed to emit any business events
}

export interface ServerToClientEvents {
  new_order: (payload: { orderId: string; orderNumber: string; total: number; customerName: string }) => void;
  order_status_changed: (payload: {
    orderId: string;
    orderNumber: string;
    status: "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  }) => void;
  low_stock: (payload: { productId: string; productName: string; stock: number }) => void;
  out_of_stock: (payload: { productId: string; productName: string }) => void;
  new_customer: (payload: { customerId: string; fullName: string; email: string }) => void;
  product_created: (payload: { productId: string; name: string; slug: string; categoryId: string }) => void;
  product_updated: (payload: { productId: string; name: string; slug: string; categoryId: string }) => void;
  product_deleted: (payload: { productId: string }) => void;
  category_created: (payload: { categoryId: string; name: string }) => void;
  category_updated: (payload: { categoryId: string; name: string }) => void;
  category_deleted: (payload: { categoryId: string }) => void;
  homepage_updated: (payload: { version: string }) => void;
  order_confirmed: (payload: { orderId: string; orderNumber: string }) => void;
  order_shipped: (payload: { orderId: string; orderNumber: string; trackingNumber?: string }) => void;
  order_delivered: (payload: { orderId: string; orderNumber: string }) => void;
}

export interface InterServerEvents {
  // For Redis adapter in the future
}
