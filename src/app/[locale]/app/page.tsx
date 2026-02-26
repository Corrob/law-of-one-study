import { Suspense } from "react";
import InstallAppContent from "./InstallAppContent";

export default function InstallAppPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh cosmic-bg" />}>
      <InstallAppContent />
    </Suspense>
  );
}
