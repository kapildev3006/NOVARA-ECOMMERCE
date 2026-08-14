import { Metadata } from "next";
import { Breadcrumb } from "@/components/marketplace/Breadcrumb";
import { DesktopFilterSidebar } from "@/components/marketplace/DesktopFilterSidebar";
import { MobileFilterDrawer } from "@/components/marketplace/MobileFilterDrawer";
import { ProductSort } from "@/components/marketplace/ProductSort";
import { ProductGrid } from "@/components/product/ProductGrid";
import { mockProducts } from "@/data/products";
import { filterProducts, sortProducts, FilterParams, SortOption } from "@/lib/product-utils";

export const metadata: Metadata = {
  title: "All Products - NOVARA",
  description: "Browse the complete NOVARA catalog.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProductsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  // Extract params safely
  const query = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const minPrice = typeof searchParams.minPrice === "string" ? Number(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === "string" ? Number(searchParams.maxPrice) : undefined;
  const rating = typeof searchParams.rating === "string" ? Number(searchParams.rating) : undefined;
  const inStock = searchParams.inStock === "true";
  const sort = typeof searchParams.sort === "string" ? (searchParams.sort as SortOption) : "relevance";

  const filters: FilterParams = {
    query,
    category,
    minPrice,
    maxPrice,
    rating,
    inStock,
  };

  // Filter and Sort purely using mock data
  const filtered = filterProducts(mockProducts, filters);
  const sorted = sortProducts(filtered, sort);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: query ? `Search: "${query}"` : "All Products" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-2">
              {query ? `Results for "${query}"` : "All Products"}
            </h1>
            <p className="text-muted font-medium">
              Showing {sorted.length} {sorted.length === 1 ? "product" : "products"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <MobileFilterDrawer />
            <ProductSort />
          </div>
        </div>

        <div className="flex items-start gap-8">
          <DesktopFilterSidebar />
          <div className="flex-1 w-full min-w-0">
            <ProductGrid products={sorted} />
          </div>
        </div>
      </div>
    </main>
  );
}
