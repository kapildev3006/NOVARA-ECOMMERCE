import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview - Homepage CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
