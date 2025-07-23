import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from "@/components/ui/card";

export default function TournamentPageLoading() {
    return (
        <div className="container mx-auto px-4 py-8 md:pb-8 pb-24 space-y-8">
            <Skeleton className="h-64 md:h-80 rounded-lg w-full" />
            <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-full" />
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <div className="pt-8 space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
