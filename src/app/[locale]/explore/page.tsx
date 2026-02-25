import { Suspense } from "react";
import ExploreContent from "./ExploreContent";

export default function ExplorePage() {
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <ExploreContent />
    </Suspense>
  );
}
