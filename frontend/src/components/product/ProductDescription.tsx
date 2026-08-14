interface ProductDescriptionProps {
  description: string;
}

export function ProductDescription({ description }: ProductDescriptionProps) {
  if (!description) return null;

  return (
    <div className="mt-16 pt-12 border-t border-black/5">
      <h2 className="text-2xl font-heading font-bold mb-6">Product Description</h2>
      <div className="prose prose-neutral max-w-none">
        <p className="text-base text-muted leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
