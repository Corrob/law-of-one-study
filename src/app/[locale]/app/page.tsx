import { Suspense } from "react";
import InstallAppContent from "./InstallAppContent";

function InstallAppSkeleton() {
  return (
    <main className="min-h-dvh flex flex-col cosmic-bg relative">
      <div className="flex-1 overflow-auto relative z-10 py-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--lo1-celestial)]/20 animate-pulse mx-auto mb-4" />
          <div className="h-10 w-64 bg-[var(--lo1-celestial)]/20 rounded animate-pulse mx-auto mb-4" />
          <div className="h-5 w-80 bg-[var(--lo1-celestial)]/20 rounded animate-pulse mx-auto" />
        </div>
      </div>
    </main>
  );
}

export default function InstallAppPage() {
  return (
    <Suspense fallback={<InstallAppSkeleton />}>
      <InstallAppContent />
    </Suspense>
  );
}
