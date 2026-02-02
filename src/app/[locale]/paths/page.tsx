import { Suspense } from "react";
import NavBarSkeleton from "@/components/NavBarSkeleton";
import PathsContent from "./PathsContent";

function PathsSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavBarSkeleton />
      <div className="flex-1 overflow-auto relative z-10 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-[var(--lo1-celestial)]/20 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-[var(--lo1-space)]/50 border border-[var(--lo1-celestial)]/20 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PathsPage() {
  return (
    <Suspense fallback={<PathsSkeleton />}>
      <PathsContent />
    </Suspense>
  );
}
