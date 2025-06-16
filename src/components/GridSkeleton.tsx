import { Skeleton } from "@/components/ui/skeleton";
import { GRID_CONFIG } from "@/lib/constants";

interface GridSkeletonProps {
  count?: number;
  columns?: number;
  showDetails?: boolean;
}

export default function GridSkeleton({
  count = 9,
  columns = 3,
  showDetails = true,
}: GridSkeletonProps) {
  return (
    <div 
      className="grid gap-0.8 w-full mx-1 md:mx-2"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
      aria-label="Loading grids"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-1">
          <div className="relative border border-border rounded-md p-2 aspect-square">
            <Skeleton className="w-full h-full rounded-sm" />
            
            {showDetails && (
              <div className="mt-2 space-y-2 pt-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 