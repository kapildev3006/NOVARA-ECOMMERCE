import Image from "next/image";

interface ProductGalleryProps {
  image: string;
  name: string;
  images?: string[]; // For future use
}

export function ProductGallery({ image, name }: ProductGalleryProps) {
  // Currently, we only have one image per product from mock data.
  // The architecture allows an array of images to be mapped here in the future.
  
  return (
    <div className="flex flex-col gap-4 sticky top-32">
      {/* Main Image Container */}
      <div className="relative aspect-square w-full bg-white rounded-2xl border border-black/5 overflow-hidden flex items-center justify-center p-8 group">
        <Image
          src={image}
          alt={name}
          fill
          priority
          className="object-contain mix-blend-multiply p-8 transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails (Placeholder for future) */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button className="relative w-20 h-20 shrink-0 bg-white rounded-xl border-2 border-primary overflow-hidden flex items-center justify-center p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
          <Image
            src={image}
            alt={`Thumbnail of ${name}`}
            fill
            className="object-contain mix-blend-multiply p-2"
            sizes="80px"
          />
        </button>
      </div>
    </div>
  );
}
