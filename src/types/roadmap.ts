export interface Feature {
  id: string;
  title: string;
  description: string;
  category: "foundation" | "study-tools" | "community" | "content" | "immersive";
  phase: "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4";
  userValue: 1 | 2 | 3 | 4 | 5; // 1-5 stars
  complexity: "Low" | "Low-Medium" | "Medium" | "Medium-High" | "High" | "Very High";
  status: "planned" | "in-progress" | "shipped";
  votes: number;
  features: string[]; // bullet points of features
}

export interface VoteData {
  [featureId: string]: boolean; // true if user has voted
}
