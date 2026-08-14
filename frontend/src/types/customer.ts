import { Order } from "./order";
import { Address } from "./address";

export interface AdminCustomer {
  id: string; // phone number is the primary key
  name: string;
  email: string | null;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  status: "Active" | "Inactive";
  orders: Order[];
  addresses: Address[];
}
