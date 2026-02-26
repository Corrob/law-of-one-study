import { Suspense } from "react";
import PathsContent from "./PathsContent";

export default function PathsPage() {
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <PathsContent />
    </Suspense>
  );
}
