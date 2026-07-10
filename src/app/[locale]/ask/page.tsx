import { Suspense } from "react";
import AskContent from "./AskContent";

export default function AskPage() {
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <AskContent />
    </Suspense>
  );
}
