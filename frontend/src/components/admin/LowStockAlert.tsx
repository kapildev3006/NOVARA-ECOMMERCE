import Image from "next/image";

const LOW_STOCK_ITEMS = [
  { 
    id: "1", 
    name: "Nova Pro Gaming Headset", 
    sku: "NVR-HP-001", 
    stock: 3, 
    image: "/images/products/headphones.jpg" 
  },
  { 
    id: "2", 
    name: "Stealth Wireless Controller", 
    sku: "NVR-CN-002", 
    stock: 5, 
    image: "/images/products/smartwatch.jpg" 
  },
  { 
    id: "3", 
    name: "Mechanical RGB Keyboard", 
    sku: "NVR-KB-003", 
    stock: 7, 
    image: "/images/products/smartphone.jpg" 
  },
];

export function LowStockAlert() {
  return (
    <div className="flex flex-col h-full bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5]">
      <div className="flex justify-between items-center p-6 border-b border-[#e5e5e5]">
        <h2 className="font-heading font-bold text-lg text-[#161513]">Low Stock Alert</h2>
        <button className="px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]">
          View All
        </button>
      </div>

      <div className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          {LOW_STOCK_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-lg bg-gray-50 border border-black/5 overflow-hidden shrink-0">
                <Image 
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#161513] text-sm truncate">{item.name}</h4>
                <p className="text-xs font-medium text-gray-500 mt-0.5">SKU: {item.sku}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-[#161513] text-sm mb-0.5">Stock: {item.stock}</p>
                <p className="text-xs font-bold text-[#ff4b2b]">Low Stock</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
