import { Suspense } from "react";
import MusicContent from "./MusicContent";

export default function MusicPage() {
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <MusicContent />
    </Suspense>
  );
}
