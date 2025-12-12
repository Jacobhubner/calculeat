import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ToolSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-8 bg-neutral-200 rounded w-64"></div>
          <div className="h-4 bg-neutral-200 rounded w-96"></div>
        </div>
        <div className="h-6 bg-neutral-200 rounded w-24"></div>
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-neutral-200 rounded w-48"></div>
              <div className="h-4 bg-neutral-200 rounded w-64 mt-2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-neutral-200 rounded"></div>
              <div className="h-10 bg-neutral-200 rounded"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-neutral-200 rounded w-32"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-20 bg-neutral-200 rounded"></div>
              <div className="h-20 bg-neutral-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
