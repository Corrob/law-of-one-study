import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Law of One Study Companion",
  description:
    "Learn about the Law of One Study Companion - an AI-powered tool for exploring the Ra Material. Free, open-source, and community-funded.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "About | Law of One Study Companion",
    description:
      "Learn about the Law of One Study Companion - an AI-powered tool for exploring the Ra Material.",
    url: "https://lawofone.study/support",
    type: "website",
  },
};

// Spiral/Unity icon (same as main page)
function UnityIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path
        d="M50 20
           C70 20, 80 35, 80 50
           C80 65, 65 75, 50 75
           C35 75, 25 62, 25 50
           C25 38, 35 30, 50 30
           C60 30, 68 40, 68 50
           C68 60, 58 67, 50 67
           C42 67, 35 58, 35 50
           C35 42, 43 37, 50 37"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SupportPage() {
  return (
    <main className="min-h-dvh flex flex-col cosmic-bg relative">
      {/* Header */}
      <header className="relative z-10 bg-[var(--lo1-indigo)]/80 backdrop-blur-sm text-white py-4 px-6 border-b border-[var(--lo1-gold)]/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors text-sm group rounded focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-indigo)]"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Study Companion
          </Link>
          <div className="flex items-center gap-2">
            <UnityIcon className="w-6 h-6 text-[var(--lo1-gold)] starburst" />
            <span className="text-xs text-[var(--lo1-stardust)] hidden sm:inline">About</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto relative z-10 py-12 px-6">
        <article className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4">
              About This Tool
            </h1>
            <p className="text-[var(--lo1-stardust)] text-lg">
              An AI-powered companion for exploring the Ra Material
            </p>
          </div>

          {/* How It Works Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-8 text-center">
              How This Study Companion Works
            </h2>
            <p className="text-[var(--lo1-stardust)] text-center mb-10 max-w-2xl mx-auto">
              This tool helps you explore the Ra Material using artificial intelligence. Here's how
              it works in simple terms:
            </p>

            {/* Step Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Step 1 */}
              <div className="bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center text-[var(--lo1-gold)] font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--lo1-starlight)]">
                    Ask a Question
                  </h3>
                </div>
                <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                  Type any question about the Law of One, concepts from the Ra Material, or
                  spiritual topics covered in the sessions.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center text-[var(--lo1-gold)] font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--lo1-starlight)]">AI Searches</h3>
                </div>
                <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                  Your question is converted into a mathematical representation and compared against
                  all ~1,500 Q&A pairs from the 106 sessions.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center text-[var(--lo1-gold)] font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--lo1-starlight)]">
                    Get Response
                  </h3>
                </div>
                <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed mb-3">
                  Receive contextual explanations with:
                </p>
                <ul className="text-[var(--lo1-stardust)] text-sm space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--lo1-gold)] mt-1">•</span>
                    <span>Direct quotes from Ra in highlighted cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--lo1-gold)] mt-1">•</span>
                    <span>Contextual explanations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--lo1-gold)] mt-1">•</span>
                    <span>Linked key concepts</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Warning Box */}
            <div className="p-6 bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/40 rounded-xl max-w-3xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[var(--lo1-gold)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--lo1-starlight)] leading-relaxed">
                    <strong className="text-[var(--lo1-gold)]">Important:</strong> The AI's
                    explanatory text is meant to help you understand, but it should not be
                    considered authoritative and may contain errors. Like all AI language models,
                    this chatbot can sometimes "hallucinate" or generate inaccurate information.
                    Only the direct quotes from Ra (shown in the highlighted quote cards) are
                    authentic passages from the Ra Material.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* About LL Research Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6">
              About L/L Research
            </h2>
            <div className="bg-[var(--lo1-indigo)]/20 border border-[var(--lo1-celestial)]/30 rounded-2xl p-8">
              <p className="text-[var(--lo1-stardust)] leading-relaxed mb-4">
                The Ra Material, also known as{" "}
                <em className="text-[var(--lo1-starlight)]">The Law of One</em>, was channeled
                between 1981 and 1984 through Carla Rueckert by the social memory complex Ra. The
                sessions were facilitated by Don Elkins (questioner) and Jim McCarty (scribe).
              </p>
              <p className="text-[var(--lo1-stardust)] leading-relaxed mb-6">
                <strong className="text-[var(--lo1-starlight)]">L/L Research</strong> is the
                nonprofit organization that originally published the Ra Material and continues to
                steward these teachings. Founded by Don Elkins, Carla Rueckert, and Jim McCarty, L/L
                Research has dedicated itself to making the Law of One freely available to seekers
                worldwide.
              </p>

              {/* Resource Links */}
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="https://www.llresearch.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/20 rounded-xl hover:border-[var(--lo1-gold)]/50 hover:shadow-[0_0_20px_rgba(212,168,83,0.15)] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-deep-space)]"
                >
                  <svg
                    className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="text-[var(--lo1-starlight)] font-medium group-hover:text-[var(--lo1-gold)] transition-colors">
                      llresearch.org
                    </div>
                    <div className="text-xs text-[var(--lo1-stardust)]">
                      Official L/L Research website
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-[var(--lo1-gold)] opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>

                <a
                  href="https://www.lawofone.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/20 rounded-xl hover:border-[var(--lo1-gold)]/50 hover:shadow-[0_0_20px_rgba(212,168,83,0.15)] transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-deep-space)]"
                >
                  <svg
                    className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="text-[var(--lo1-starlight)] font-medium group-hover:text-[var(--lo1-gold)] transition-colors">
                      lawofone.info
                    </div>
                    <div className="text-xs text-[var(--lo1-stardust)]">
                      Searchable archive (our source)
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-[var(--lo1-gold)] opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </section>

          {/* Copyright Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6">
              Copyright and Attribution
            </h2>
            <div className="text-[var(--lo1-stardust)] space-y-4">
              <p className="leading-relaxed">
                The Ra Contact (The Law of One) is copyrighted by L/L Research, which has generously
                made the material available for free personal and non-commercial use.
              </p>
              <div className="bg-[var(--lo1-indigo)]/20 border border-[var(--lo1-celestial)]/30 rounded-xl p-6">
                <p className="text-sm text-[var(--lo1-starlight)] mb-3">
                  According to L/L Research's copyright guidelines:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>
                      The material may be freely quoted for personal, educational, and
                      non-commercial purposes
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Attribution should be given to L/L Research and the Law of One</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Commercial use requires explicit permission from L/L Research</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm leading-relaxed">
                All quotes displayed in this study companion link directly to the source at{" "}
                <a
                  href="https://www.lawofone.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--lo1-gold)] hover:underline"
                >
                  lawofone.info
                </a>{" "}
                for verification and further study.
              </p>
            </div>
          </section>

          {/* Project Details */}
          <section className="mb-16">
            <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6">
              Project Details
            </h2>
            <div className="bg-[var(--lo1-indigo)]/20 border border-[var(--lo1-celestial)]/30 rounded-2xl p-8">
              <p className="text-[var(--lo1-stardust)] leading-relaxed mb-6">
                The Law of One Study Companion is an independent, open-source project created to
                help students of the Ra Material explore and understand the teachings more easily.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div>
                    <div className="text-[var(--lo1-starlight)] font-medium">
                      Free and open source
                    </div>
                    <div className="text-sm text-[var(--lo1-stardust)]">
                      Code publicly available on GitHub
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-[var(--lo1-starlight)] font-medium">Community-funded</div>
                    <div className="text-sm text-[var(--lo1-stardust)]">
                      Built with love for seekers
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-[var(--lo1-starlight)] font-medium">
                      Independent project
                    </div>
                    <div className="text-sm text-[var(--lo1-stardust)]">
                      Not affiliated with L/L Research
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[var(--lo1-gold)] flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <div>
                    <div className="text-[var(--lo1-starlight)] font-medium">
                      Continuously improving
                    </div>
                    <div className="text-sm text-[var(--lo1-stardust)]">
                      Feedback and contributions welcome
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--lo1-gold)]/20">
                <p className="text-sm text-[var(--lo1-stardust)]">
                  If you find this tool helpful, please consider{" "}
                  <a
                    href="https://www.llresearch.org/donate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--lo1-gold)] hover:underline font-medium"
                  >
                    supporting L/L Research directly
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Technical Details */}
          <section className="mb-16">
            <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6">
              Technical Details
            </h2>
            <div className="bg-[var(--lo1-indigo)]/20 border border-[var(--lo1-celestial)]/30 rounded-xl p-6">
              <p className="text-[var(--lo1-stardust)] text-sm mb-4">
                For those interested in the technical implementation:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-[var(--lo1-indigo)]/30 rounded-lg">
                  <span className="text-[var(--lo1-stardust)]">AI Model:</span>
                  <span className="text-[var(--lo1-starlight)] font-medium">OpenAI GPT-5-mini</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[var(--lo1-indigo)]/30 rounded-lg">
                  <span className="text-[var(--lo1-stardust)]">Vector Search:</span>
                  <span className="text-[var(--lo1-starlight)] font-medium">Pinecone</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[var(--lo1-indigo)]/30 rounded-lg">
                  <span className="text-[var(--lo1-stardust)]">Embeddings:</span>
                  <span className="text-[var(--lo1-starlight)] font-medium">
                    text-embedding-3-small
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[var(--lo1-indigo)]/30 rounded-lg">
                  <span className="text-[var(--lo1-stardust)]">Framework:</span>
                  <span className="text-[var(--lo1-starlight)] font-medium">Next.js 16</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--lo1-gold)]/20">
                <a
                  href="https://github.com/Corrob/law-of-one-study"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors text-sm group rounded focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-deep-space)]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View source code on GitHub
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </section>

          {/* Important Disclaimer */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-[var(--lo1-indigo)]/60 to-[var(--lo1-indigo)]/40 border-2 border-[var(--lo1-gold)]/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(212,168,83,0.15)]">
              <div className="flex items-start gap-4 mb-4">
                <svg
                  className="w-8 h-8 text-[var(--lo1-gold)] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2 className="text-2xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)]">
                  Important Disclaimer
                </h2>
              </div>
              <div className="space-y-4 text-[var(--lo1-starlight)]">
                <p className="leading-relaxed">
                  <strong className="text-[var(--lo1-gold)]">
                    This tool is far from a primary study of the Ra Material and should only be used
                    to supplement your study or for curiosity.
                  </strong>{" "}
                  It is not a replacement for reading the original sessions directly.
                </p>
                <p className="leading-relaxed text-sm">
                  Like all AI language models, this chatbot has limitations and can potentially
                  provide inaccurate or misleading information. The AI may sometimes "hallucinate"
                  (generate information that doesn't exist in the source material) or misinterpret
                  Ra's teachings. Only the highlighted quote cards contain verified passages from
                  the Ra Material—all other explanatory text is AI-generated interpretation that may
                  contain errors.
                </p>
                <p className="leading-relaxed text-sm border-t border-[var(--lo1-gold)]/20 pt-4">
                  <strong>Always verify important information</strong> by consulting the original Ra
                  Material at{" "}
                  <a
                    href="https://www.lawofone.info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--lo1-gold)] hover:underline"
                  >
                    lawofone.info
                  </a>{" "}
                  or in the published books available from{" "}
                  <a
                    href="https://www.llresearch.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--lo1-gold)] hover:underline"
                  >
                    L/L Research
                  </a>
                  . For serious study of the Law of One, there is no substitute for reading the
                  primary source material.
                </p>
              </div>
            </div>
          </section>

          {/* Contact/Feedback */}
          <section className="mb-16">
            <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6">
              Feedback and Questions
            </h2>
            <div className="bg-[var(--lo1-indigo)]/20 border border-[var(--lo1-celestial)]/30 rounded-xl p-6">
              <p className="text-[var(--lo1-stardust)] leading-relaxed mb-4">
                This tool is continuously evolving based on user feedback. If you encounter issues,
                have suggestions, or want to contribute:
              </p>
              <a
                href="https://github.com/Corrob/law-of-one-study/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/30 rounded-lg text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/20 hover:border-[var(--lo1-gold)]/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-deep-space)]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Submit Feedback on GitHub
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          </section>

          {/* Footer Quote */}
          <div className="mt-20 pt-8 border-t border-[var(--lo1-gold)]/20 text-center">
            <div className="max-w-2xl mx-auto">
              <p className="text-2xl font-[family-name:var(--font-cormorant)] italic text-[var(--lo1-gold)] leading-relaxed mb-4">
                "The seeking and finding of the Creator within the self and within the other-self is
                the essence of the Law of One."
              </p>
              <a
                href="https://www.lawofone.info/s/76#16"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--lo1-stardust)] hover:text-[var(--lo1-gold)] transition-colors rounded focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-deep-space)]"
              >
                — Ra, Session 76.16
              </a>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
