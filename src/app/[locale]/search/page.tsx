import { Suspense } from "react";
import SearchContent from "./SearchContent";

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <SearchContent />
    </Suspense>
  );
}
