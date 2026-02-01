import { Suspense } from "react";
import PathDetailContent from "./PathDetailContent";

interface PathDetailPageProps {
  params: Promise<{ pathId: string }>;
}

function PathDetailSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <div className="flex-1 overflow-auto relative z-10 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-1 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-[var(--lo1-celestial)]/20 animate-pulse"
              />
            ))}
          </div>
          <div className="h-8 w-64 bg-[var(--lo1-celestial)]/20 rounded animate-pulse mb-8" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-[var(--lo1-celestial)]/20 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-[var(--lo1-celestial)]/20 rounded animate-pulse" />
            <div className="h-24 w-full bg-[var(--lo1-celestial)]/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function PathDetailPage({ params }: PathDetailPageProps) {
  const { pathId } = await params;
  return (
    <Suspense fallback={<PathDetailSkeleton />}>
      <PathDetailContent pathId={pathId} />
    </Suspense>
  );
}
