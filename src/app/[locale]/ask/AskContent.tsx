"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const { messages, isStreaming, error, suggestions, sendMessage, reset } = useAskStream(locale);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message (and follow-up chips) in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, suggestions]);

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

            {/* Message area */}
            <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-4">
              <div className="max-w-2xl mx-auto space-y-4">
                {!hasMessages && <AskWelcome onPickStarter={handleSend} />}

                {messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--lo1-gold)]/15 px-4 py-2.5 text-[var(--lo1-starlight)] whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-full w-full rounded-2xl rounded-bl-sm bg-[var(--lo1-indigo)]/50 px-4 py-3">
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
