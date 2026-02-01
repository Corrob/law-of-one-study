import { Suspense } from "react";
import SearchContent from "./SearchContent";

function SearchSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <div className="flex-1 overflow-auto relative z-10 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="h-10 w-full bg-[var(--lo1-space)]/50 border border-[var(--lo1-celestial)]/20 rounded-xl animate-pulse" />
        </div>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
