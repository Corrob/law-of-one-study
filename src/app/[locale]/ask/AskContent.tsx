"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import NavigationWrapper from "@/components/NavigationWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import AskWelcome from "@/components/ask/AskWelcome";
import AskAnswer from "@/components/ask/AskAnswer";
import AskComposer from "@/components/ask/AskComposer";
import AskThinking from "@/components/ask/AskThinking";
import AskAttribution from "@/components/ask/AskAttribution";
import { useAskStream } from "@/hooks/useAskStream";
import { askAnalytics } from "@/lib/ask/analytics";
import { type AvailableLanguage } from "@/lib/language-config";

export default function AskContent() {
  const locale = useLocale() as AvailableLanguage;
  const t = useTranslations("ask");
  // Saved discernment notes — one is chosen per question (instant, local).
  const disclaimers = useMemo(() => {
    const raw = t.raw("disclaimers");
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);
  const { messages, isStreaming, error, suggestions, sendMessage, reset } = useAskStream(
    locale,
    disclaimers
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevUserCount = useRef(0);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Show the "jump to latest" affordance whenever the reader isn't near the bottom.
  const updateScrollDown = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight > el.clientHeight + 40;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollDown(scrollable && !nearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  // Pin a newly asked question near the top of the view so the answer grows
  // beneath it. We deliberately do NOT auto-scroll while the answer streams —
  // that would pull the reader off their place. (Standard chat pattern.)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length === 0) prevUserCount.current = 0;
    const userCount = messages.reduce((n, m) => (m.role === "user" ? n + 1 : n), 0);
    if (userCount > prevUserCount.current) {
      prevUserCount.current = userCount;
      const nodes = el.querySelectorAll<HTMLElement>('[data-role="user"]');
      const last = nodes[nodes.length - 1];
      if (last) {
        const delta = last.getBoundingClientRect().top - el.getBoundingClientRect().top - 8;
        el.scrollTo({ top: el.scrollTop + delta, behavior: "smooth" });
      }
    }
    updateScrollDown();
  }, [messages, updateScrollDown]);

  const handleSend = useCallback(
    (message: string) => {
      void sendMessage(message);
    },
    [sendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <div className="starfield" />
      <NavigationWrapper>
        <ErrorBoundary>
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            {/* New conversation control */}
            {hasMessages && (
              <div className="flex justify-end px-4 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-[var(--lo1-stardust)] hover:text-[var(--lo1-gold)] transition-colors cursor-pointer"
                >
                  {t("newConversation")}
                </button>
              </div>
            )}

            {/* Message area (relative wrapper anchors the jump-to-latest button) */}
            <div className="relative flex-1 flex flex-col overflow-hidden">
            <div
              ref={scrollRef}
              onScroll={updateScrollDown}
              className="chat-scroll flex-1 overflow-y-auto px-4 py-4"
            >
              <div className="max-w-2xl mx-auto space-y-4">
                {!hasMessages && <AskWelcome onPickStarter={handleSend} />}

                {messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} data-role="user" className="flex justify-end scroll-mt-2">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--lo1-gold)]/15 px-4 py-2.5 text-[var(--lo1-starlight)] whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-full w-full rounded-2xl rounded-bl-sm bg-[var(--lo1-indigo)]/50 px-4 py-3">
                        {message.disclaimer && (
                          <p className="animate-fade-in mb-3 text-sm italic leading-relaxed text-[var(--lo1-stardust)]/75">
                            {message.disclaimer}
                          </p>
                        )}
                        {message.content ? (
                          <AskAnswer content={message.content} />
                        ) : (
                          <AskThinking />
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Follow-up suggestions for the latest answer. */}
                {!isStreaming && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        data-testid="ask-suggestion"
                        onClick={() => {
                          askAnalytics.suggestionClicked({ suggestion, index });
                          handleSend(suggestion);
                        }}
                        className="text-sm text-left px-3 py-1.5 rounded-full border border-[var(--lo1-gold)]/25
                                   bg-[var(--lo1-indigo)]/40 text-[var(--lo1-stardust)]
                                   hover:bg-[var(--lo1-gold)]/10 hover:text-[var(--lo1-starlight)] hover:border-[var(--lo1-gold)]/50
                                   transition-colors cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="text-sm text-red-300 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-2"
                  >
                    {error}
                  </div>
                )}
              </div>
            </div>

              {/* Jump to latest — only when scrolled away from the bottom */}
              {showScrollDown && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  aria-label={t("scrollToLatest")}
                  className="absolute bottom-3 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full
                             border border-[var(--lo1-gold)]/30 bg-[var(--lo1-indigo)]/85 text-[var(--lo1-gold)]
                             shadow-lg backdrop-blur-sm hover:bg-[var(--lo1-indigo)] transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
            </div>

            {/* Composer + attribution */}
            <div className="px-4 pb-4 pt-2 border-t border-[var(--lo1-gold)]/10 bg-[var(--lo1-void)]/40 backdrop-blur-sm">
              <div className="max-w-2xl mx-auto space-y-2">
                <AskComposer onSend={handleSend} disabled={isStreaming} />
                <AskAttribution />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </NavigationWrapper>
    </main>
  );
}
