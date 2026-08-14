import { Category } from "@/types/category";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  return (
    <Link
      href={`#`}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden novara-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Image Area */}
      <div className="relative aspect-[4/5] sm:aspect-square w-full bg-surface overflow-hidden">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-0"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
        />
        
        {/* Subtle overlay for text legibility, not completely black */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-6">
          <h3 className="text-white font-heading text-xl sm:text-2xl font-bold mb-1 sm:mb-2 drop-shadow-md">
            {category.name}
          </h3>
          <div className="flex items-center text-white/90 text-sm font-medium group-hover:text-white transition-colors">
            Shop Now 
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}
