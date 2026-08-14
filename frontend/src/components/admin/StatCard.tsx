import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  growth: string;
  growthText: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
  trendColorClass: string;
}

export function StatCard({ 
  title, 
  value, 
  growth, 
  growthText, 
  icon: Icon, 
  iconColorClass, 
  iconBgClass,
  trendColorClass
}: StatCardProps) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div className="flex items-start gap-4 mb-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", iconBgClass)}>
          <Icon className={cn("w-6 h-6", iconColorClass)} />
        </div>
        <div className="flex-1 mt-1">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-[#161513] tracking-tight">{value}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <span className={cn("text-xs font-bold", trendColorClass)}>
          {growth}
        </span>
        <span className="text-xs font-medium text-gray-400">{growthText}</span>
      </div>
    </div>
  );
}
