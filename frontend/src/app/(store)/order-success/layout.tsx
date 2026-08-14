import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order-Success',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
