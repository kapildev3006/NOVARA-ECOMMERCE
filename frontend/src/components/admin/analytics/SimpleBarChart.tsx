"use client";

import { useMemo } from "react";
import { formatPrice } from "@/lib/utils";

interface DataPoint {
  date: string;
  sales: number;
  orders: number;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  metric: "sales" | "orders";
}

export function SimpleBarChart({ data, metric }: SimpleBarChartProps) {
  const chartHeight = 250;
  const paddingTop = 20;
  const paddingBottom = 30;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  
  const maxValue = useMemo(() => {
    const max = Math.max(...data.map(d => d[metric]), 0);
    return max > 0 ? max : 100; // default max if data is empty or all zeros
  }, [data, metric]);

  if (data.length === 0) {
    return (
      <div className="w-full h-[250px] flex items-center justify-center text-sm font-medium text-gray-400 bg-[#FAFAF8] rounded-xl border border-dashed border-[#e5e5e5]">
        No data available for this range
      </div>
    );
  }

  const formatLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatValue = (val: number) => {
    if (metric === "sales") return formatPrice(val);
    return val.toString();
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="min-w-[600px] w-full" style={{ height: chartHeight }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + innerHeight - (innerHeight * ratio);
            const val = maxValue * ratio;
            return (
              <g key={i}>
                <line 
                  x1="0" 
                  y1={y} 
                  x2="100%" 
                  y2={y} 
                  stroke="#e5e5e5" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x="0" 
                  y={y - 5} 
                  fontSize="10" 
                  fill="#9ca3af" 
                  fontWeight="bold"
                >
                  {metric === "sales" ? `₹${(val / 1000).toFixed(0)}k` : Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((point, i) => {
            const val = point[metric];
            const ratio = val / maxValue;
            const barHeight = Math.max(ratio * innerHeight, 4); // min height of 4px for visibility
            const y = paddingTop + innerHeight - barHeight;
            
            // Calculate x positions as percentages
            const barWidth = 100 / data.length;
            const xOffset = (i * barWidth) + (barWidth * 0.1); // 10% padding
            const rectWidth = barWidth * 0.8; // 80% width

            return (
              <g key={point.date} className="group">
                <rect
                  x={`${xOffset}%`}
                  y={y}
                  width={`${rectWidth}%`}
                  height={barHeight}
                  fill={metric === "sales" ? "#ff4b2b" : "#3b82f6"}
                  rx="4"
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
                {/* Tooltip text (visible on hover) */}
                <text
                  x={`${xOffset + (rectWidth / 2)}%`}
                  y={y - 8}
                  fontSize="10"
                  fill="#161513"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {formatValue(val)}
                </text>
                
                {/* X-axis labels (only show roughly 7 labels to prevent crowding) */}
                {(i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
                  <text
                    x={`${xOffset + (rectWidth / 2)}%`}
                    y={chartHeight - 10}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {formatLabel(point.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
