"use client";

import { Menu, Bell, ChevronDown } from "lucide-react";

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="h-[64px] bg-white border-b border-[#e5e5e5] flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Notification Bell */}
        <button className="relative p-2 text-gray-500 hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1.5 w-4 h-4 bg-[#ff4b2b] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            3
          </span>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-3 pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] rounded-lg">
          <div className="w-10 h-10 bg-[#333] text-white font-bold flex items-center justify-center rounded-full text-lg">
            A
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-bold leading-tight">Admin</span>
            <span className="text-[11px] text-gray-500 font-medium">Super Admin</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
