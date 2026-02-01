import { Suspense } from "react";
import ChatContent from "./ChatContent";

function ChatSkeleton() {
  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-[var(--lo1-celestial)]/20 animate-pulse" />
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
