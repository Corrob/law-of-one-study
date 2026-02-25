import { Suspense } from "react";
import ChatContent from "./ChatContent";

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <ChatContent />
    </Suspense>
  );
}
