"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import NavigationWrapper from "@/components/NavigationWrapper";
import { titleVariants, staggerContainer, staggerChild } from "@/lib/animations";

// Feature icons for the Features section
function SeekIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="8" r="2" />
      <circle cx="19" cy="8" r="2" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
      <path strokeLinecap="round" d="M9.5 10.5L6.5 9M14.5 10.5L17.5 9M10 14.5L8.5 16.5M14 14.5L15.5 16.5" />
    </svg>
  );
}

function StudyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

export default function SupportPage() {
  return (
    <NavigationWrapper>
      <main className="min-h-dvh flex flex-col cosmic-bg relative">
        {/* Content */}
        <div className="flex-1 overflow-auto relative z-10 py-8 px-6">
          <article className="max-w-4xl mx-auto">
            {/* Page Title */}
            <motion.div
              className="text-center mb-12"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
            >
              <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4">
                About This Tool
              </h1>
              <p className="text-[var(--lo1-stardust)] text-lg">
                An AI-powered companion for exploring the Ra Material
              </p>
            </motion.div>

            {/* Features Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6 text-center">
                Features
              </h2>
              <motion.div
                className="grid md:grid-cols-2 gap-4"
                variants={staggerContainer(0.1)}
                initial="hidden"
                animate="visible"
              >
                {/* Seek Feature */}
                <motion.div variants={staggerChild}>
                  <Link
                    href="/chat"
                    className="block bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                        <SeekIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                        Seek
                      </h3>
                    </div>
                    <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                      Ask questions and receive AI-powered answers with verified quotes from the Ra Material. Each response includes direct citations you can verify.
                    </p>
                  </Link>
                </motion.div>

                {/* Explore Feature */}
                <motion.div variants={staggerChild}>
                  <Link
                    href="/explore"
                    className="block bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                        <ExploreIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                        Explore
                      </h3>
                    </div>
                    <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                      Navigate an interactive concept graph showing relationships between key ideas in the Ra Material. Discover connections and explore related quotes.
                    </p>
                  </Link>
                </motion.div>

                {/* Study Feature */}
                <motion.div variants={staggerChild}>
                  <Link
                    href="/paths"
                    className="block bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                        <StudyIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                        Study
                      </h3>
                    </div>
                    <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                      Follow guided learning paths with structured lessons, reflection prompts, and quizzes. Track your progress as you deepen your understanding.
                    </p>
                  </Link>
                </motion.div>

                {/* Search Feature */}
                <motion.div variants={staggerChild}>
                  <Link
                    href="/search"
                    className="block bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                        <SearchIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                        Search
                      </h3>
                    </div>
                    <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                      Search the Ra Material by meaning. Find specific quotes with Sentence mode, or explore broader concepts with Passage mode.
                    </p>
                  </Link>
                </motion.div>
              </motion.div>
            </section>

            {/* How It Works Section */}
            <section className="mb-20">
              <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-8 text-center">
                How Seek Works
              </h2>
              <p className="text-[var(--lo1-stardust)] text-center mb-10 max-w-2xl mx-auto">
                When you ask a question in the Seek feature, here&apos;s what happens behind the scenes:
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
                This tool is continuously evolving based on user feedback. If you encounter issues
                or have suggestions, we&apos;d love to hear from you:
              </p>
              <a
                href="mailto:support@lawofone.study"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/30 rounded-lg text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/20 hover:border-[var(--lo1-gold)]/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-deep-space)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                support@lawofone.study
              </a>
            </div>
          </section>

          {/* Footer Quote */}
          <div className="mt-20 pt-8 border-t border-[var(--lo1-gold)]/20 text-center">
            <div className="max-w-2xl mx-auto">
              <p className="text-2xl font-[family-name:var(--font-cormorant)] italic text-[var(--lo1-gold)] leading-relaxed mb-4">
                &ldquo;You are every thing, every being, every emotion, every event, every situation.
                You are unity. You are infinity. You are love/light, light/love. You are. This is the
                Law of One.&rdquo;
              </p>
              <a
                href="https://www.lawofone.info/s/1#7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--lo1-stardust)] hover:text-[var(--lo1-gold)] transition-colors rounded focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:ring-offset-2 focus:ring-offset-[var(--lo1-deep-space)]"
              >
                — Ra, Session 1.7
              </a>
            </div>
          </div>
          </article>
        </div>
      </main>
    </NavigationWrapper>
  );
}
