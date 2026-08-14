import { ProductFilterControls } from "./ProductFilterControls";

export function DesktopFilterSidebar() {
  return (
    <aside className="hidden lg:block w-[260px] shrink-0 h-fit sticky top-32">
      <div className="bg-background rounded-2xl border border-black/5 p-6 shadow-sm">
        <h2 className="text-xl font-heading font-bold mb-6 tracking-tight">Filters</h2>
        <ProductFilterControls />
      </div>
    </aside>
  );
}
