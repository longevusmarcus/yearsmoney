import { Skeleton } from "@/components/ui/skeleton";

const ProductCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex gap-4">
        {/* Icon placeholder */}
        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Title */}
              <Skeleton className="h-4 w-3/4 mb-2" />
              {/* Description */}
              <Skeleton className="h-3 w-full mb-1" />
              {/* Price and source */}
              <div className="flex items-center gap-2 mt-1">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
            
            {/* Time display */}
            <div className="text-right shrink-0">
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          
          {/* Full time breakdown */}
          <div className="mt-2">
            <Skeleton className="h-2.5 w-2/3" />
          </div>
          
          {/* ROI and link */}
          <div className="mt-2 flex items-center justify-between">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductSkeletonList = () => {
  return (
    <div className="px-6 py-4">
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4 font-light animate-pulse">
        Searching the web for the best deals...
      </p>
    </div>
  );
};

export default ProductCardSkeleton;
