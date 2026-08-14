import { Metadata } from 'next';
import { CheckoutProvider } from "@/context/CheckoutContext";

export const metadata: Metadata = {
  title: 'Checkout | NOVARA',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CheckoutProvider>{children}</CheckoutProvider>;
}
