import { Suspense } from "react";
import MeditateContent from "./MeditateContent";

export default function MeditatePage() {
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <MeditateContent />
    </Suspense>
  );
}
