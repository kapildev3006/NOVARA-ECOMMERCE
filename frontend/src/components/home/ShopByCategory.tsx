import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryCard } from "@/components/category/CategoryCard";
import { mockCategories } from "@/data/categories";

export function ShopByCategory() {
  return (
    <section className="bg-background py-10 md:py-16">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h2 className="font-heading text-2xl md:text-[32px] font-bold text-foreground tracking-tight mb-1.5 md:mb-2">
              Shop by Categories
            </h2>
            <p className="text-muted text-xs md:text-sm hidden sm:block">
              Explore our wide range of products
            </p>
          </div>
          <Link 
            href="#" 
            className="group flex items-center text-xs md:text-sm font-semibold text-muted hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm pb-1"
          >
            View All Categories
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {mockCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
