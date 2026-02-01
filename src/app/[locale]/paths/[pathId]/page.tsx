import PathDetailContent from "./PathDetailContent";

interface PathDetailPageProps {
  params: Promise<{ pathId: string }>;
}

export default function PathDetailPage({ params }: PathDetailPageProps) {
  return <PathDetailContent params={params} />;
}
