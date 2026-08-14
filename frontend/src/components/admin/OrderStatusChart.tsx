export function OrderStatusChart() {
  const data = [
    { label: "Delivered", count: 124, percent: 48.4, color: "#22c55e" },
    { label: "Processing", count: 78, percent: 30.5, color: "#3b82f6" },
    { label: "Shipped", count: 32, percent: 12.5, color: "#f97316" },
    { label: "Cancelled", count: 22, percent: 8.6, color: "#a855f7" },
  ];

  const total = 256;
  const radius = 80;
  const strokeWidth = 35;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5]">
      <h2 className="font-heading font-bold text-lg text-[#161513] mb-6">Order Status Overview</h2>
      
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            {data.map((item) => {
              const dashLength = (item.percent / 100) * circumference;
              const dashOffset = -(cumulativePercent / 100) * circumference;
              cumulativePercent += item.percent;

              return (
                <circle
                  key={item.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500 ease-in-out"
                />
              );
            })}
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-[#161513] leading-none mb-1">
              {total}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              Total Orders
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {data.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span 
                className="w-3 h-3 rounded-full mt-1 shrink-0" 
                style={{ backgroundColor: item.color }} 
              />
              <div>
                <p className="text-sm font-bold text-[#161513]">{item.label}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {item.count} ({item.percent}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
