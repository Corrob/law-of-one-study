import { Suspense } from "react";
import NavBarSkeleton from "@/components/NavBarSkeleton";
import MeditateContent from "./MeditateContent";

function MeditateSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavBarSkeleton />
      <div className="flex-1 overflow-auto relative z-10 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Title skeleton */}
          <div className="text-center space-y-2">
            <div className="h-8 w-40 mx-auto rounded bg-[var(--lo1-celestial)]/20 animate-pulse" />
            <div className="h-4 w-64 mx-auto rounded bg-[var(--lo1-celestial)]/20 animate-pulse" />
          </div>
          {/* Player skeleton */}
          <div className="h-64 rounded-2xl bg-[var(--lo1-celestial)]/20 animate-pulse" />
          {/* List skeleton */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-[var(--lo1-celestial)]/20 animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function MeditatePage() {
  return (
    <Suspense fallback={<MeditateSkeleton />}>
      <MeditateContent />
    </Suspense>
  );
}
