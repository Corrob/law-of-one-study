import { Suspense } from "react";
import PathDetailContent from "./PathDetailContent";

interface PathDetailPageProps {
  params: Promise<{ pathId: string }>;
}

export default async function PathDetailPage({ params }: PathDetailPageProps) {
  const { pathId } = await params;
  return (
    <Suspense fallback={<main className="h-dvh cosmic-bg" />}>
      <PathDetailContent pathId={pathId} />
    </Suspense>
  );
}
