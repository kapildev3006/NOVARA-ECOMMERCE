import { AdminLayoutClient } from "./AdminLayoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | NOVARA Admin",
    default: "Dashboard | NOVARA Admin",
  },
  description: "Admin dashboard for NOVARA.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
