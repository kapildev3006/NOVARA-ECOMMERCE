interface ProductSpecificationsProps {
  specifications?: Record<string, string>;
}

export function ProductSpecifications({ specifications }: ProductSpecificationsProps) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t border-black/5 pt-12">
      <h2 className="text-2xl font-heading font-bold mb-8">Technical Specifications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        {Object.entries(specifications).map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-start py-4 border-b border-black/5 last:border-b-0 md:last:border-b">
            <span className="text-sm font-semibold text-muted w-full sm:w-40 shrink-0 mb-1 sm:mb-0">
              {key}
            </span>
            <span className="text-sm font-medium text-foreground break-words">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
