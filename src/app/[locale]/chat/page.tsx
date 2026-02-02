import { Suspense } from "react";
import NavBarSkeleton from "@/components/NavBarSkeleton";
import ChatContent from "./ChatContent";

function ChatSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavBarSkeleton />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-8 w-72 rounded bg-[var(--lo1-celestial)]/20 animate-pulse" />
        <div className="h-12 w-full max-w-lg rounded-xl bg-[var(--lo1-celestial)]/20 animate-pulse" />
        <div className="h-8 w-40 rounded bg-[var(--lo1-celestial)]/20 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-[var(--lo1-celestial)]/20 animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContent />
    </Suspense>
  );
}
