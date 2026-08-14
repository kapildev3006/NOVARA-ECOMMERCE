import { AdminCustomer } from "@/types/customer";
import { getOrders } from "./order-utils";
import { Order } from "@/types/order";

const CUSTOMER_STATUS_KEY = "novara-customers-status";

export function getDerivedCustomers(): AdminCustomer[] {
  const orders = getOrders();
  if (!orders || orders.length === 0) return [];

  // Group by phone number
  const grouped = orders.reduce((acc, order) => {
    const phone = order.address.phone;
    if (!acc[phone]) {
      acc[phone] = [];
    }
    acc[phone].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  // Read statuses
  let statuses: Record<string, "Active" | "Inactive"> = {};
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CUSTOMER_STATUS_KEY);
      if (stored) {
        statuses = JSON.parse(stored);
      }
    }
  } catch (error) {
    console.error("Failed to parse customer statuses", error);
  }

  // Build customer list
  return Object.keys(grouped).map((phone) => {
    const customerOrders = grouped[phone];
    
    // Sort to find the latest order for the canonical name
    customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestOrder = customerOrders[0];
    
    // Calculate totals
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    
    // Unique addresses
    const uniqueAddresses = Array.from(new Map(customerOrders.map(o => [o.address.addressLine1 + o.address.postalCode, o.address])).values());

    return {
      id: phone,
      name: latestOrder.address.fullName,
      email: null, // "Email not available" pattern as requested
      phone: phone,
      ordersCount: customerOrders.length,
      totalSpent: totalSpent,
      lastOrderDate: latestOrder.createdAt,
      status: statuses[phone] || "Active",
      orders: customerOrders,
      addresses: uniqueAddresses
    };
  });
}

export function updateCustomerStatus(phoneId: string, status: "Active" | "Inactive"): void {
  try {
    if (typeof window !== "undefined") {
      let statuses: Record<string, "Active" | "Inactive"> = {};
      const stored = localStorage.getItem(CUSTOMER_STATUS_KEY);
      if (stored) {
        statuses = JSON.parse(stored);
      }
      statuses[phoneId] = status;
      localStorage.setItem(CUSTOMER_STATUS_KEY, JSON.stringify(statuses));
    }
  } catch (error) {
    console.error("Failed to update customer status", error);
  }
}
