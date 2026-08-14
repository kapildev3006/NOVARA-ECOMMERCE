import { Metadata } from "next";
import { notFound } from "next/navigation";
import { mockProducts } from "@/data/products";
import { Breadcrumb } from "@/components/marketplace/Breadcrumb";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductPrice } from "@/components/product/ProductPrice";
import { ProductActions } from "@/components/product/ProductActions";
import { DeliveryInfo } from "@/components/product/DeliveryInfo";
import { ProductDescription } from "@/components/product/ProductDescription";
import { ProductSpecifications } from "@/components/product/ProductSpecifications";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const product = mockProducts.find(p => p.slug === params.slug);
  
  if (!product) return { title: "Product Not Found - NOVARA" };
  
  return {
    title: `${product.name} - NOVARA`,
    description: product.description,
  };
}

export default async function ProductPage(props: { params: Params }) {
  const params = await props.params;
  const product = mockProducts.find(p => p.slug === params.slug);

  if (!product) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: product.category, href: `/category/${product.category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}` },
    { label: product.name }
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
        <Breadcrumb items={breadcrumbItems} className="mb-8" />
        
        {/* Top Section: Gallery + Info */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Left Column: Gallery */}
          <div className="w-full lg:w-[55%] shrink-0">
            <ProductGallery image={product.image} name={product.name} />
          </div>

          {/* Right Column: Details & Actions */}
          <div className="w-full lg:w-[45%] flex flex-col min-w-0">
            <ProductInfo 
              productId={product.id}
              name={product.name}
              category={product.category}
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
            
            <ProductPrice 
              price={product.price}
              originalPrice={product.originalPrice}
              discount={product.discount}
            />
            
            <ProductActions productId={product.id} stock={product.stock} />
            
            <DeliveryInfo />
          </div>
        </div>

        {/* Bottom Section: Description, Specs, Related, Recent */}
        <div className="max-w-4xl">
          <ProductDescription description={product.description} />
          <ProductSpecifications specifications={product.specifications} />
        </div>
        
        <RelatedProducts currentProductId={product.id} category={product.category} />
        
        <RecentlyViewed currentSlug={product.slug} />
      </div>
    </main>
  );
}
