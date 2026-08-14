import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | NOVARA",
    default: "NOVARA | Discover Products You'll Love",
  },
  description: "Shop the latest products across categories, curated for modern lifestyles.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased font-sans bg-background text-foreground min-h-screen w-full">
        <div className="flex flex-col min-h-screen overflow-x-clip w-full max-w-[100vw]">
          {children}
        </div>
      </body>
    </html>
  );
}
