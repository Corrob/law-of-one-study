'use client';

import Link from 'next/link';

export default function SupportPage() {
  return (
    <main className="min-h-dvh flex flex-col cosmic-bg relative">
      {/* Header */}
      <header className="relative z-10 bg-[var(--lo1-indigo)]/80 backdrop-blur-sm text-white py-4 px-6 border-b border-[var(--lo1-gold)]/20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors text-sm"
          >
            ← Back to Study Companion
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto relative z-10 py-12 px-6">
        <article className="max-w-3xl mx-auto prose prose-invert prose-headings:text-[var(--lo1-starlight)] prose-h1:text-3xl prose-h2:text-2xl prose-h2:text-[var(--lo1-gold)] prose-h3:text-xl prose-p:text-[var(--lo1-stardust)] prose-a:text-[var(--lo1-gold)] prose-a:no-underline hover:prose-a:underline prose-strong:text-[var(--lo1-starlight)] prose-ul:text-[var(--lo1-stardust)]">

          <h1 className="!text-[var(--lo1-starlight)] !mb-8">About This Tool</h1>

          {/* How It Works Section */}
          <section className="mb-12">
            <h2>How This Study Companion Works</h2>
            <p>
              This tool helps you explore the Ra Material using artificial intelligence. Here's how it works in simple terms:
            </p>

            <h3 className="!text-[var(--lo1-starlight)] !mt-6">1. You Ask a Question</h3>
            <p>
              Type any question about the Law of One, concepts from the Ra Material, or spiritual topics covered in the sessions.
            </p>

            <h3 className="!text-[var(--lo1-starlight)] !mt-6">2. The AI Searches the Material</h3>
            <p>
              Behind the scenes, your question is converted into a mathematical representation (called an "embedding") and compared against all ~1,500 question-and-answer pairs from the 106 Ra sessions. This process finds the most relevant passages related to your query.
            </p>

            <h3 className="!text-[var(--lo1-starlight)] !mt-6">3. You Receive a Response</h3>
            <p>
              The AI reads the relevant passages and crafts a response that:
            </p>
            <ul>
              <li><strong>Provides context and explanation</strong> in conversational language</li>
              <li><strong>Includes direct quotes from Ra</strong> displayed in highlighted quote cards</li>
              <li><strong>Links key concepts</strong> that you can explore further</li>
            </ul>

            <p className="!text-sm !mt-6 !mb-6 p-4 bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/30 rounded">
              <strong className="!text-[var(--lo1-gold)]">Important:</strong> The AI's explanatory text is meant to help you understand, but it should not be considered authoritative and may contain errors. Like all AI language models, this chatbot can sometimes "hallucinate" or generate inaccurate information. Only the direct quotes from Ra (shown in the highlighted quote cards) are authentic passages from the Ra Material. The AI's commentary and interpretation may contain inaccuracies or misinterpret Ra's teachings.
            </p>
          </section>

          {/* About LL Research Section */}
          <section className="mb-12">
            <h2>About L/L Research</h2>
            <p>
              The Ra Material, also known as <em>The Law of One</em>, was channeled between 1981 and 1984 through Carla Rueckert by the social memory complex Ra. The sessions were facilitated by Don Elkins (questioner) and Jim McCarty (scribe).
            </p>
            <p>
              <strong><a href="https://www.llresearch.org" target="_blank" rel="noopener noreferrer">L/L Research</a></strong> is the nonprofit organization that originally published the Ra Material and continues to steward these teachings. Founded by Don Elkins, Carla Rueckert, and Jim McCarty, L/L Research has dedicated itself to making the Law of One freely available to seekers worldwide.
            </p>
            <p>
              The complete Ra Material is available free of charge at:
            </p>
            <ul>
              <li><a href="https://www.llresearch.org" target="_blank" rel="noopener noreferrer">llresearch.org</a> — Official L/L Research website</li>
              <li><a href="https://www.lawofone.info" target="_blank" rel="noopener noreferrer">lawofone.info</a> — Searchable online archive (source for this tool)</li>
            </ul>
          </section>

          {/* Copyright and Attribution */}
          <section className="mb-12">
            <h2>Copyright and Attribution</h2>
            <p>
              The Ra Contact (The Law of One) is copyrighted by L/L Research, which has generously made the material available for free personal and non-commercial use.
            </p>
            <p>
              According to L/L Research's <a href="https://www.llresearch.org/copyright" target="_blank" rel="noopener noreferrer">copyright guidelines</a>:
            </p>
            <ul>
              <li>The material may be freely quoted for personal, educational, and non-commercial purposes</li>
              <li>Attribution should be given to L/L Research and the Law of One</li>
              <li>Commercial use requires explicit permission from L/L Research</li>
            </ul>
            <p>
              All quotes displayed in this study companion link directly to the source at <a href="https://www.lawofone.info" target="_blank" rel="noopener noreferrer">lawofone.info</a> for verification and further study.
            </p>
          </section>

          {/* About This Tool */}
          <section className="mb-12">
            <h2>About This Tool</h2>
            <p>
              The Law of One Study Companion is an independent, open-source project created to help students of the Ra Material explore and understand the teachings more easily. This tool is:
            </p>
            <ul>
              <li><strong>Free and open source</strong> — The code is publicly available on GitHub</li>
              <li><strong>Community-funded</strong> — Built with love for the Law of One community</li>
              <li><strong>Not affiliated with L/L Research</strong> — This is an independent project, though we deeply respect and acknowledge their stewardship of the material</li>
              <li><strong>Continuously improving</strong> — We welcome feedback and contributions</li>
            </ul>
            <p>
              If you find this tool helpful and want to support the original work, please consider <a href="https://www.llresearch.org/support" target="_blank" rel="noopener noreferrer">supporting L/L Research directly</a>.
            </p>
          </section>

          {/* Technical Details */}
          <section className="mb-12">
            <h2>Technical Details</h2>
            <p>
              For those interested in the technical implementation:
            </p>
            <ul>
              <li><strong>AI Model:</strong> OpenAI GPT-4 (for generating responses)</li>
              <li><strong>Vector Search:</strong> Pinecone (for finding relevant passages)</li>
              <li><strong>Embeddings:</strong> OpenAI text-embedding-3-small (for semantic search)</li>
              <li><strong>Framework:</strong> Next.js 15 with React</li>
              <li><strong>Source Code:</strong> Available on <a href="https://github.com/Corrob/law-of-one-study" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section className="mb-12 p-6 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 rounded-lg">
            <h2 className="!mt-0">Important Disclaimer</h2>
            <p>
              <strong>This tool is far from a primary study of the Ra Material and should only be used to supplement your study or for curiosity.</strong> It is not a replacement for reading the original sessions directly.
            </p>
            <p>
              Like all AI language models, this chatbot has limitations and can potentially provide inaccurate or misleading information. The AI may sometimes "hallucinate" (generate information that doesn't exist in the source material) or misinterpret Ra's teachings. Only the highlighted quote cards contain verified passages from the Ra Material—all other explanatory text is AI-generated interpretation that may contain errors.
            </p>
            <p className="!mb-0">
              <strong>Always verify important information</strong> by consulting the original Ra Material at <a href="https://www.lawofone.info" target="_blank" rel="noopener noreferrer">lawofone.info</a> or in the published books available from <a href="https://www.llresearch.org" target="_blank" rel="noopener noreferrer">L/L Research</a>. For serious study of the Law of One, there is no substitute for reading the primary source material.
            </p>
          </section>

          {/* Contact/Feedback */}
          <section className="mb-12">
            <h2>Feedback and Questions</h2>
            <p>
              This tool is continuously evolving based on user feedback. If you encounter issues, have suggestions, or want to contribute, please visit our <a href="https://github.com/Corrob/law-of-one-study" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
            </p>
          </section>

          {/* Footer Quote */}
          <div className="mt-16 pt-8 border-t border-[var(--lo1-gold)]/20 text-center">
            <p className="!text-[var(--lo1-gold)] italic">
              "The seeking and finding of the Creator within the self and within the other-self is the essence of the Law of One."
            </p>
            <p className="!text-sm !text-[var(--lo1-stardust)] !mt-2">— Ra, Session 76</p>
          </div>
        </article>
      </div>
    </main>
  );
}
