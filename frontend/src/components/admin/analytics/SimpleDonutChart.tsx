"use client";

import { useMemo } from "react";
import { formatPrice } from "@/lib/utils";

interface DonutDataItem {
  label: string;
  value: number;
}

interface SimpleDonutChartProps {
  data: DonutDataItem[];
  metricType: "currency" | "number";
}

const COLORS = ["#ff4b2b", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

export function SimpleDonutChart({ data, metricType }: SimpleDonutChartProps) {
  
  // Filter out zeros to avoid dividing by zero or painting invisible slices
  const validData = useMemo(() => data.filter(d => d.value > 0).slice(0, 7), [data]);
  const total = useMemo(() => validData.reduce((sum, item) => sum + item.value, 0), [validData]);

  const formatValue = (val: number) => {
    if (metricType === "currency") return formatPrice(val);
    return val.toString();
  };

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const arcs = useMemo(() => {
    return validData.map((item, i) => {
      const percent = item.value / total;
      
      // If it's 100%, render a full circle instead of a path
      if (percent === 1) {
        return {
          item,
          color: COLORS[i % COLORS.length],
          isFullCircle: true
        };
      }

      const cumulativePercent = validData.slice(0, i).reduce((sum, d) => sum + (d.value / total), 0);

      const startX = getCoordinatesForPercent(cumulativePercent)[0];
      const startY = getCoordinatesForPercent(cumulativePercent)[1];
      
      const newCumulativePercent = cumulativePercent + percent;
      
      const endX = getCoordinatesForPercent(newCumulativePercent)[0];
      const endY = getCoordinatesForPercent(newCumulativePercent)[1];
      
      const largeArcFlag = percent > 0.5 ? 1 : 0;
      
      // SVG Path for an arc slice
      const pathData = [
        `M ${startX} ${startY}`, // Move
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}` // Arc
      ].join(' ');

      return {
        item,
        color: COLORS[i % COLORS.length],
        pathData,
        isFullCircle: false
      };
    });
  }, [validData, total]);

  if (validData.length === 0) {
    return (
      <div className="w-full h-[250px] flex items-center justify-center text-sm font-medium text-gray-400 bg-[#FAFAF8] rounded-xl border border-dashed border-[#e5e5e5]">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 h-full">
      {/* Chart */}
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
          {arcs.map((arc, i) => {
            if (arc.isFullCircle) {
              return (
                <circle 
                  key={i} 
                  r="1" 
                  cx="0" 
                  cy="0" 
                  fill="none" 
                  stroke={arc.color} 
                  strokeWidth="0.4"
                />
              );
            }
            return (
              <path
                key={i}
                d={arc.pathData}
                fill="none"
                stroke={arc.color}
                strokeWidth="0.4"
                className="hover:stroke-[0.45] transition-all cursor-pointer hover:opacity-80"
              >
                <title>{arc.item.label}: {formatValue(arc.item.value)}</title>
              </path>
            );
          })}
        </svg>
        
        {/* Inner Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total</span>
          <span className="text-sm font-black text-[#161513]">{metricType === "number" ? total : `₹${(total/1000).toFixed(0)}k`}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-2">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 truncate pr-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
              <span className="text-gray-600 font-medium truncate" title={arc.item.label}>
                {arc.item.label}
              </span>
            </div>
            <span className="font-bold text-[#161513] shrink-0">
              {formatValue(arc.item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
