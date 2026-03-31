import { Skeleton } from "@/components/ui/skeleton";

export function PagesSeoFormSkeleton() {
    return (
        <div className="flex">
            <div className="w-1/4 pr-4">
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
                <Skeleton className="h-10 w-full mt-4" />
            </div>
            <div className="w-3/4 space-y-8">
                {[...Array(11)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
}
