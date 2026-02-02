import { Suspense } from "react";
import NavBarSkeleton from "@/components/NavBarSkeleton";
import SearchContent from "./SearchContent";

function SearchSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavBarSkeleton />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-9 w-52 rounded-full bg-[var(--lo1-celestial)]/20 animate-pulse" />
        <div className="h-7 w-64 rounded bg-[var(--lo1-celestial)]/20 animate-pulse" />
        <div className="h-12 w-full max-w-lg rounded-xl bg-[var(--lo1-celestial)]/20 animate-pulse" />
        <div className="h-4 w-80 rounded bg-[var(--lo1-celestial)]/20 animate-pulse" />
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 w-28 rounded-lg bg-[var(--lo1-celestial)]/20 animate-pulse"
            />
          ))}
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
