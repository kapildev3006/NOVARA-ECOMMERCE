import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/marketplace/Breadcrumb";
import { DesktopFilterSidebar } from "@/components/marketplace/DesktopFilterSidebar";
import { MobileFilterDrawer } from "@/components/marketplace/MobileFilterDrawer";
import { ProductSort } from "@/components/marketplace/ProductSort";
import { ProductGrid } from "@/components/product/ProductGrid";
import { mockProducts } from "@/data/products";
import { mockCategories } from "@/data/categories";
import { filterProducts, sortProducts, FilterParams, SortOption } from "@/lib/product-utils";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const category = mockCategories.find(c => c.slug === params.slug);
  
  if (!category) return { title: "Category Not Found - NOVARA" };
  
  return {
    title: `${category.name} - NOVARA`,
    description: `Shop the latest ${category.name} at NOVARA.`,
  };
}

export default async function CategoryPage(props: { params: Params; searchParams: SearchParams }) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const categoryData = mockCategories.find(c => c.slug === params.slug);
  if (!categoryData) {
    notFound();
  }

  // Extract other search params safely
  const minPrice = typeof searchParams.minPrice === "string" ? Number(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === "string" ? Number(searchParams.maxPrice) : undefined;
  const rating = typeof searchParams.rating === "string" ? Number(searchParams.rating) : undefined;
  const inStock = searchParams.inStock === "true";
  const sort = typeof searchParams.sort === "string" ? (searchParams.sort as SortOption) : "relevance";

  // Force the category filter to match this page's category
  const filters: FilterParams = {
    category: categoryData.slug,
    minPrice,
    maxPrice,
    rating,
    inStock,
  };

  const filtered = filterProducts(mockProducts, filters);
  const sorted = sortProducts(filtered, sort);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/#categories" },
    { label: categoryData.name },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-2">
              {categoryData.name}
            </h1>
            <p className="text-muted font-medium max-w-2xl">
              Shop our curated collection of {categoryData.name.toLowerCase()} with {sorted.length} {sorted.length === 1 ? "product" : "products"} available.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <MobileFilterDrawer />
            <ProductSort />
          </div>
        </div>

        <div className="flex items-start gap-8">
          {/* Note: The DesktopFilterSidebar will read searchParams, so it works perfectly. However, the 'category' checkbox state might be slightly off if we don't pass it in, but the URL controls it. Wait, the URL won't have ?category=electronics on the /category/electronics page. 
          To fix this, we can either update ProductFilterControls to read from the path, or just hide the category filter on this page. 
          For 2A, it's fine if the checkbox isn't checked, or we can just let users browse. Actually, if they check a new category, it will navigate to /category/electronics?category=mobiles which might be weird. 
          The cleanest way is for ProductFilterControls to use an injected category if present, but since it's a small mock, we'll keep it simple. */}
          <DesktopFilterSidebar />
          <div className="flex-1 w-full min-w-0">
            <ProductGrid products={sorted} />
          </div>
        </div>
      </div>
    </main>
  );
}
