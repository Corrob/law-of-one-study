import { Suspense } from "react";
import ExploreContent from "./ExploreContent";

function ExploreSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--lo1-stardust)] animate-pulse">Loading graph...</div>
      </div>
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreContent />
    </Suspense>
  );
}
