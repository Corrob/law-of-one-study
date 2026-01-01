import { Feature } from "@/types/roadmap";

export const roadmapFeatures: Feature[] = [
  // PRIORITY 1: Favorite Quotes
  {
    id: "favorite-quotes",
    title: "Favorite Quotes",
    description:
      "Save and organize your favorite Ra quotes. One-click bookmarking with collections, search, export, and sharing capabilities.",
    category: "foundation",
    priority: 1,
    userValue: 5,
    complexity: "Low-Medium",
    status: "planned",
    votes: 0,
    features: [
      "One-click heart icon on quote cards",
      "Works offline (localStorage) with cloud sync option",
      "Organize into collections/folders",
      "Search within favorites",
      "Export to PDF, Markdown, or email",
      "Share quotes or collections",
      "Beautiful gallery view",
    ],
  },

  // PRIORITY 2: Daily Quote
  {
    id: "daily-quote",
    title: "Daily Quote",
    description: "Start each day with a meaningful quote from Ra. Share it, save it, or just reflect on it.",
    category: "foundation",
    priority: 2,
    userValue: 4,
    complexity: "Low",
    status: "planned",
    votes: 0,
    features: [
      "Beautiful daily quote from Ra Material",
      "New quote at midnight (your timezone)",
      "Share to social media with attribution",
      "Optional email delivery",
      "Random quote button",
      "Add to favorites instantly",
      "Historical archive of past daily quotes",
    ],
  },

  // PRIORITY 3: Reading Progress Tracker
  {
    id: "reading-progress",
    title: "Reading Progress Tracker",
    description:
      "Track which sessions you've read and get personalized recommendations for what to study next.",
    category: "foundation",
    priority: 3,
    userValue: 4,
    complexity: "Low-Medium",
    status: "planned",
    votes: 0,
    features: [
      "Check off sessions as you read them",
      "Visual progress tracker (42/106 complete)",
      "Smart recommendations based on what you've read",
      "Mark sessions as 'want to read' or 'currently reading'",
      "Notes on each session",
      "Share your progress",
      "Works offline with optional cloud sync",
    ],
  },

  // PRIORITY 4: Adept Cycle Tracker
  {
    id: "cycle-tracker",
    title: "Adept Cycle Tracker",
    description:
      "Track and understand the various cycles Ra describes to optimize your spiritual practice. Visualize your personal energy patterns over time.",
    category: "study-tools",
    priority: 4,
    userValue: 5,
    complexity: "Medium",
    status: "planned",
    votes: 0,
    features: [
      "Personal energy cycle tracking (moods, catalyst, insights)",
      "Visualization of your patterns over time",
      "Ra's teachings on cycles linked to your data",
      "Daily/weekly/monthly cycle views",
      "Moon phases and their significance",
      "Optional astrological cycle integration",
      "Insights: 'You tend to experience catalyst on Tuesdays'",
      "Journal integration for deeper reflection",
      "Completely private, encrypted data",
      "Export cycle data for personal analysis",
    ],
  },

  // PRIORITY 5: User Authentication
  {
    id: "user-auth",
    title: "Optional User Accounts",
    description:
      "Sign in to sync your favorites, notes, and progress across devices. Completely optional - all core features work without an account.",
    category: "foundation",
    priority: 5,
    userValue: 4,
    complexity: "Medium",
    status: "planned",
    votes: 0,
    features: [
      "Passwordless email login (magic link)",
      "Social auth (Google, GitHub)",
      "Never required for core features",
      "Sync favorites, notes, and progress",
      "Privacy-focused with minimal data collection",
      "Export all your data anytime",
      "Delete account and all data with one click",
    ],
  },

  // PRIORITY 6: Study Notes & Annotations
  {
    id: "study-notes",
    title: "Study Notes & Annotations",
    description:
      "Create a personal knowledge base with notes on quotes, sessions, and concepts. Bi-directional linking and AI-powered summaries.",
    category: "study-tools",
    priority: 6,
    userValue: 5,
    complexity: "Medium-High",
    status: "planned",
    votes: 0,
    features: [
      "Attach notes to quotes, sessions, or concepts",
      "Rich text and Markdown support",
      "Bi-directional linking (Zettelkasten style)",
      "Tag notes with concepts",
      "Graph view showing connections",
      "AI-powered note summaries",
      "Export all notes as one document",
      "Private by default, optional sharing",
      "Reference quotes directly in notes",
    ],
  },

  // PRIORITY 7: Ra Journaling Helper
  {
    id: "journaling",
    title: "Ra Journaling Helper",
    description:
      "AI-powered journaling for personal growth and spiritual reflection. Link entries to quotes, track patterns, and deepen your practice.",
    category: "study-tools",
    priority: 7,
    userValue: 4,
    complexity: "Medium",
    status: "planned",
    votes: 0,
    features: [
      "Dedicated private journaling space",
      "AI prompts based on Ra teachings",
      "Link entries to specific quotes",
      "Calendar view of entries",
      "AI reflection assistant",
      "Pattern analysis and insights",
      "Tag entries by theme (catalyst, balancing, service)",
      "Completely private and encrypted",
      "Export journal",
      "Optional cycle tracker integration",
    ],
  },

  // PRIORITY 8: Concept Explorer
  {
    id: "concept-explorer",
    title: "Concept Explorer (Interactive Graph)",
    description:
      "Visualize the connections between concepts in the Ra Material. Navigate the teachings through an interactive knowledge graph.",
    category: "study-tools",
    priority: 8,
    userValue: 5,
    complexity: "Medium-High",
    status: "planned",
    votes: 0,
    features: [
      "Visual graph of interconnected concepts",
      "Click concepts to see related quotes",
      "Zoom, pan, and explore",
      "Search to find concepts",
      "Suggested learning pathways",
      "Leverages AI embeddings for relationships",
      "Beautiful cosmic-themed visualization",
      "Optional 3D view for advanced exploration",
    ],
  },

  // PRIORITY 9: Guided Study Paths
  {
    id: "study-paths",
    title: "Guided Study Paths",
    description:
      'Structured courses for beginners and topic deep-dives. Start with "Intro to Law of One" or explore specific concepts systematically.',
    category: "study-tools",
    priority: 9,
    userValue: 4,
    complexity: "Medium",
    status: "planned",
    votes: 0,
    features: [
      "Curated learning paths (Intro, Densities, Archetypes, etc.)",
      "Step-by-step lessons with quotes and explanations",
      "Reflection prompts and optional quizzes",
      "Track progress through each path",
      "Unlock paths as you complete prerequisites",
      "Community-contributed paths (moderated)",
      "Shareable completion certificates",
      "Perfect for newcomers",
    ],
  },

  // PRIORITY 10: Enhanced Search Features
  {
    id: "enhanced-search",
    title: "Enhanced Search Features",
    description:
      "Power user search features: history, filters by session/book, advanced filters, and saved searches.",
    category: "study-tools",
    priority: 10,
    userValue: 3,
    complexity: "Low-Medium",
    status: "planned",
    votes: 0,
    features: [
      "Search history",
      "Related questions suggestions",
      "Filter by session number or book",
      "Advanced filters (Ra only, questions only)",
      "Save and name searches",
      "Search within specific concepts",
      "Boolean search operators (AND, OR, NOT)",
      "Regex support for advanced users",
      "Export search results",
    ],
  },

  // PRIORITY 11: Weekly Newsletter
  {
    id: "newsletter",
    title: "Weekly Newsletter",
    description:
      "Curated weekly content: quote of the week, concept deep-dives, and community insights delivered to your inbox.",
    category: "content",
    priority: 11,
    userValue: 3,
    complexity: "Medium",
    status: "planned",
    votes: 0,
    features: [
      "Email signup (no account needed)",
      "Quote of the week with commentary",
      "Concept deep-dives",
      "Study tips and feature updates",
      "Personalization based on interests",
      "Beautiful email design",
      "Archive of past newsletters",
      "Easy unsubscribe",
    ],
  },

  // PRIORITY 12: Onboarding Email Sequence
  {
    id: "onboarding-emails",
    title: "Onboarding Email Sequence",
    description:
      "7-day email course for new users. Learn how to use the tool and get introduced to key Law of One concepts.",
    category: "content",
    priority: 12,
    userValue: 4,
    complexity: "Low-Medium",
    status: "planned",
    votes: 0,
    features: [
      "7-day automated sequence",
      "Tool tutorials and tips",
      "Key concept introductions",
      "Actionable prompts to engage",
      "Triggered by email signup",
      "Track engagement to improve content",
      "Easy opt-out",
    ],
  },

  // PRIORITY 13: Quizzes
  {
    id: "quizzes",
    title: "Quizzes & Knowledge Tests",
    description:
      "Test your understanding with AI-generated quizzes on different topics. Track your progress and compete on leaderboards.",
    category: "content",
    priority: 13,
    userValue: 3,
    complexity: "Medium-High",
    status: "planned",
    votes: 0,
    features: [
      "Topic-based quizzes (Densities, Chakras, etc.)",
      "Multiple choice and open-ended questions",
      "AI explanations for each answer",
      "Progressive difficulty",
      "Track knowledge growth over time",
      "Challenge Mode for advanced students",
      "Optional leaderboard",
      "Share results",
      "Adaptive quizzing focuses on weak areas",
    ],
  },

  // PRIORITY 14: Guided Meditations
  {
    id: "guided-meditations",
    title: "Guided Meditations",
    description:
      "Audio meditations based on Ra teachings. Chakra balancing, contemplating unity, and more. Multiple lengths available.",
    category: "immersive",
    priority: 14,
    userValue: 4,
    complexity: "Medium",
    status: "planned",
    votes: 0,
    features: [
      "Audio meditations on Ra concepts",
      "Multiple lengths (5, 15, 30 min)",
      "Chakra balancing, higher self, unity meditations",
      "Full transcripts available",
      "Background soundscapes",
      "Download for offline use",
      "Meditation timer",
      "Journal integration",
    ],
  },

  // PRIORITY 15: Donation System
  {
    id: "donations",
    title: "Donation System",
    description:
      "Support the project to keep it free and ad-free forever. Transparent costs and optional contributions.",
    category: "foundation",
    priority: 15,
    userValue: 2,
    complexity: "Low",
    status: "planned",
    votes: 0,
    features: [
      "One-time or monthly donations",
      "Multiple platforms (Ko-fi, Buy Me a Coffee)",
      "Full cost transparency",
      "No paywalls or premium features",
      "Optional supporter badge",
      "Link to support L/L Research too",
      "Explanation of fund usage",
    ],
  },
];
