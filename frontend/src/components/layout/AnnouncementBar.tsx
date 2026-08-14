"use client";

import { useState, useEffect } from "react";

const messages = [
  "Free Worldwide Shipping Over $50",
  "Summer Sale Up To 70% Off",
  "Limited Time Flash Deals",
];

export function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-foreground text-background py-2 px-4 text-sm font-medium">
      <div className="mx-auto max-w-[1248px] w-full px-4 md:px-8 lg:px-10 flex justify-center items-center">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-center gap-6 text-xs sm:text-sm">
          {messages.map((msg, idx) => (
            <div key={idx} className="flex items-center gap-6">
              <span>{msg}</span>
              {idx < messages.length - 1 && <span className="text-muted/40">|</span>}
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden text-center text-xs w-full animate-fade-in transition-opacity duration-300">
          {messages[currentIndex]}
        </div>
      </div>
    </div>
  );
}
