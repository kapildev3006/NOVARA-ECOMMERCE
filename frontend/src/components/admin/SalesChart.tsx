"use client";

import { ChevronDown } from "lucide-react";

const SALES_DATA = [1.5, 1.5, 1.3, 1.55, 1.1, 1.0, 1.45]; // in Lakhs
const ORDERS_DATA = [40, 50, 42, 52, 35, 34, 50];
const LABELS = ["May 20", "May 21", "May 22", "May 23", "May 24", "May 25", "May 26"];

// SVG Dimensions and Padding
const W = 800;
const H = 300;
const PADDING_X = 60;
const PADDING_Y = 40;
const DRAW_W = W - PADDING_X * 2;
const DRAW_H = H - PADDING_Y * 2;

// Scales
const MAX_SALES = 2.0; // 2 Lakhs
const MAX_ORDERS = 80;

export function SalesChart() {


  // To make smooth curves, we can use bezier curves, but linear "L" is easiest.
  // The image shows smooth curves. I'll write a simple cubic bezier generator.
  const createSmoothPath = (data: number[], max: number) => {
    const points = data.map((val, i) => {
      const x = PADDING_X + (i * (DRAW_W / (data.length - 1)));
      const y = PADDING_Y + DRAW_H - ((val / max) * DRAW_H);
      return { x, y };
    });

    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const smoothSalesPath = createSmoothPath(SALES_DATA, MAX_SALES);
  const smoothOrdersPath = createSmoothPath(ORDERS_DATA, MAX_ORDERS);

  return (
    <div className="flex flex-col h-full bg-white rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-heading font-bold text-lg text-[#161513]">Sales Overview</h2>
          <div className="flex items-center gap-6 mt-4 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-[#ff4b2b] rounded-full inline-block"></span>
              Sales (₹)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-green-500 inline-block"></span>
              Orders
            </div>
          </div>
        </div>
        
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          This Week
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 w-full relative min-h-[260px]">
        {/* Custom SVG Chart */}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = PADDING_Y + DRAW_H * ratio;
            // Left Axis labels (₹)
            const salesLabel = ratio === 1 ? '₹0' : `₹${((1 - ratio) * 2)}L`;
            // Right Axis labels (Orders)
            const ordersLabel = ratio === 1 ? '0' : `${(1 - ratio) * 80}`;
            
            return (
              <g key={idx}>
                <line 
                  x1={PADDING_X} y1={y} 
                  x2={W - PADDING_X} y2={y} 
                  stroke="#f0f0f0" 
                  strokeWidth="1" 
                />
                <text x={PADDING_X - 12} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af" fontWeight="500">
                  {salesLabel}
                </text>
                <text x={W - PADDING_X + 12} y={y + 4} textAnchor="start" fontSize="11" fill="#9ca3af" fontWeight="500">
                  {ordersLabel}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {LABELS.map((label, i) => {
            const x = PADDING_X + (i * (DRAW_W / (LABELS.length - 1)));
            return (
              <text key={label} x={x} y={H - 10} textAnchor="middle" fontSize="11" fill="#9ca3af" fontWeight="500">
                {label}
              </text>
            );
          })}

          {/* Orders Dashed Line */}
          <path 
            d={smoothOrdersPath} 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="2" 
            strokeDasharray="6,4"
          />

          {/* Sales Solid Line */}
          <path 
            d={smoothSalesPath} 
            fill="none" 
            stroke="#ff4b2b" 
            strokeWidth="2.5" 
          />

          {/* Sales Data Points (Dots) */}
          {SALES_DATA.map((val, i) => {
            const x = PADDING_X + (i * (DRAW_W / (SALES_DATA.length - 1)));
            const y = PADDING_Y + DRAW_H - ((val / MAX_SALES) * DRAW_H);
            return (
              <circle key={`sales-${i}`} cx={x} cy={y} r="4" fill="#ff4b2b" stroke="#fff" strokeWidth="2" />
            );
          })}
          
          {/* Orders Data Points (Dots) */}
          {ORDERS_DATA.map((val, i) => {
            const x = PADDING_X + (i * (DRAW_W / (ORDERS_DATA.length - 1)));
            const y = PADDING_Y + DRAW_H - ((val / MAX_ORDERS) * DRAW_H);
            return (
              <circle key={`orders-${i}`} cx={x} cy={y} r="3" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
