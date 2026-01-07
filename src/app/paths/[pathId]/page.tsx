"use client";

import { use } from "react";
import NavigationWrapper from "@/components/NavigationWrapper";
import { BookIcon } from "@/components/icons";

interface PathDetailPageProps {
  params: Promise<{ pathId: string }>;
}

export default function PathDetailPage({ params }: PathDetailPageProps) {
  const { pathId } = use(params);

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavigationWrapper>
        <div className="flex-1 overflow-hidden relative z-10 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--lo1-gold)]/10 flex items-center justify-center">
              <BookIcon className="w-8 h-8 text-[var(--lo1-gold)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--lo1-starlight)] mb-2">
              Study Path: {pathId}
            </h2>
            <p className="text-[var(--lo1-stardust)] max-w-sm">
              Individual path content coming soon.
            </p>
          </div>
        </div>
      </NavigationWrapper>
    </main>
  );
}
