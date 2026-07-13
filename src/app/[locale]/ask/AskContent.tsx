"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import NavigationWrapper from "@/components/NavigationWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import AskWelcome from "@/components/ask/AskWelcome";
import AskAnswer from "@/components/ask/AskAnswer";
import AskComposer from "@/components/ask/AskComposer";
import AskThinking from "@/components/ask/AskThinking";
import AskCopyButton from "@/components/ask/AskCopyButton";
import AskSuggestions from "@/components/ask/AskSuggestions";
import AskRelatedResources from "@/components/ask/AskRelatedResources";
import ConfirmModal from "@/components/ConfirmModal";
import { useAskStream } from "@/hooks/useAskStream";
import {
  extractResourceLinks,
  renderAskMarkdown,
  stripAskMarkers,
} from "@/lib/ask/resource-links";
import {
  exportAskChatToMarkdown,
  downloadMarkdown,
  exportFilename,
  formatExportDate,
} from "@/lib/ask/export-markdown";
import { type AvailableLanguage } from "@/lib/language-config";

export default function AskContent() {
  const locale = useLocale() as AvailableLanguage;
  const t = useTranslations("ask");
  const tc = useTranslations("confirmNewChat");
  // Saved discernment notes — one is chosen per question (instant, local).
  const disclaimers = useMemo(() => {
    const raw = t.raw("disclaimers");
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);
  const { messages, isStreaming, error, suggestions, sendMessage, canRetry, retry, reset } =
    useAskStream(locale, disclaimers);

  const scrollRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
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

  // Size a trailing spacer so the latest turn can always be scrolled to the top
  // (otherwise a short answer leaves too little room to lift the question up).
  // The spacer shrinks toward zero as the answer grows past the viewport.
  const measureSpacer = useCallback(() => {
    const el = scrollRef.current;
    const spacer = spacerRef.current;
    if (!el || !spacer) return;
    const nodes = el.querySelectorAll<HTMLElement>('[data-role="user"]');
    const last = nodes[nodes.length - 1];
    if (!last) {
      spacer.style.height = "0px";
      return;
    }
    // Height of the current turn = last question top → start of the spacer.
    const lastTurnHeight = spacer.offsetTop - last.offsetTop;
    const needed = Math.max(0, el.clientHeight - lastTurnHeight - 16);
    spacer.style.height = `${needed}px`;
  }, []);

  const pinLastQuestion = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    measureSpacer(); // make room first
    const nodes = el.querySelectorAll<HTMLElement>('[data-role="user"]');
    const last = nodes[nodes.length - 1];
    if (!last) return;
    const delta = last.getBoundingClientRect().top - el.getBoundingClientRect().top - 8;
    el.scrollTo({ top: el.scrollTop + delta, behavior: "smooth" });
  }, [measureSpacer]);

  // On a NEW question, pin it near the top so the answer grows beneath it. While
  // the answer streams we don't auto-scroll (that pulls the reader off their
  // place); we only resize the spacer so it shrinks as the answer fills in.
  useEffect(() => {
    if (messages.length === 0) prevUserCount.current = 0;
    const userCount = messages.reduce((n, m) => (m.role === "user" ? n + 1 : n), 0);
    const isNewQuestion = userCount > prevUserCount.current;
    prevUserCount.current = userCount;
    requestAnimationFrame(() => {
      if (isNewQuestion) pinLastQuestion();
      else measureSpacer();
      updateScrollDown();
    });
  }, [messages, suggestions, pinLastQuestion, measureSpacer, updateScrollDown]);

  // Recompute the spacer on viewport resize.
  useEffect(() => {
    const onResize = () => measureSpacer();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureSpacer]);

  // Only answers produced in this page session are announced — a conversation
  // restored from sessionStorage on refresh shouldn't be re-read aloud.
  const [hasAsked, setHasAsked] = useState(false);
  const handleSend = useCallback(
    (message: string) => {
      setHasAsked(true);
      void sendMessage(message);
    },
    [sendMessage]
  );

  // Export the conversation as Markdown (old Seek feature, revived for Ask).
  const handleExportChat = useCallback(() => {
    if (messages.length === 0) return;
    const markdown = exportAskChatToMarkdown(messages, locale, {
      title: t("exportTitle"),
      exportedOn: t("exportedOn", { date: formatExportDate(locale) }),
      you: t("exportYou"),
      guide: t("exportGuide"),
    });
    downloadMarkdown(markdown, exportFilename());
  }, [messages, locale, t]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleNewChat = useCallback(() => setConfirmOpen(true), []);
  const handleConfirmNewChat = useCallback(() => {
    reset();
    setConfirmOpen(false);
  }, [reset]);

  const hasMessages = messages.length > 0;

  // The composer starts centered on the welcome screen and animates down to
  // the footer when the conversation begins (old Seek shared-element pattern:
  // one element, two slots, `layoutId` animates between them).
  const reduceMotion = useReducedMotion();
  const composerElement = (
    <motion.div
      layoutId="ask-composer"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
    >
      <AskComposer onSend={handleSend} disabled={isStreaming} />
    </motion.div>
  );

  // Announce the completed answer to screen readers (streamed text is never
  // announced token-by-token — only the finished whole, citation markers
  // stripped so URLs aren't read aloud).
  const lastMessage = messages.at(-1);
  const announcedAnswer =
    hasAsked && !isStreaming && lastMessage?.role === "assistant" && lastMessage.content
      ? stripAskMarkers(lastMessage.content, locale)
      : "";

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <div className="starfield" />
      <NavigationWrapper
        showNewChat={hasMessages}
        onNewChat={handleNewChat}
        showExportChat={hasMessages}
        onExportChat={handleExportChat}
        disableExportChat={isStreaming}
      >
        <ErrorBoundary>
          <LayoutGroup>
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            {/* Message area (relative wrapper anchors the jump-to-latest button) */}
            <div className="relative flex-1 flex flex-col overflow-hidden">
            <div
              ref={scrollRef}
              onScroll={updateScrollDown}
              className="chat-scroll flex-1 overflow-y-auto px-4 py-4"
            >
              <AnimatePresence mode="wait">
              {!hasMessages ? (
                <motion.div
                  key="welcome"
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  className="min-h-full max-w-2xl mx-auto flex flex-col justify-center"
                >
                  <AskWelcome onPickStarter={handleSend} composer={composerElement} />
                </motion.div>
              ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.1 }}
                className="max-w-2xl mx-auto space-y-4"
              >
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
                          <>
                            <AskAnswer content={message.content} />
                            {!(isStreaming && message.id === messages.at(-1)?.id) && (
                              <AskCopyButton
                                text={renderAskMarkdown(message.content, locale, {
                                  absolute: true,
                                })}
                              />
                            )}
                            {/* "Explore further" — quiet footer inside each
                                settled answer, deduped against inline links.
                                Cards stay with their answer across later
                                questions and page refreshes. */}
                            {message.related &&
                              message.related.length > 0 &&
                              !(isStreaming && message.id === messages.at(-1)?.id) && (
                                <AskRelatedResources
                                  items={message.related}
                                  excludeInline={extractResourceLinks(message.content)}
                                />
                              )}
                          </>
                        ) : (
                          <AskThinking />
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Follow-up suggestions for the latest answer. */}
                {!isStreaming && (
                  <AskSuggestions suggestions={suggestions} onPick={handleSend} />
                )}

                {error && (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-red-300 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-2"
                  >
                    <span>{error}</span>
                    {canRetry && (
                      <button
                        type="button"
                        data-testid="ask-retry"
                        onClick={retry}
                        className="shrink-0 rounded-full border border-red-300/40 px-3 py-1 text-red-200
                                   hover:bg-red-300/10 hover:border-red-300/70 transition-colors cursor-pointer"
                      >
                        {t("retry")}
                      </button>
                    )}
                  </div>
                )}

                {/* Dynamic spacer so the latest question can pin to the top. */}
                <div ref={spacerRef} aria-hidden className="shrink-0" />
              </motion.div>
              )}
              </AnimatePresence>

              {/* Screen-reader announcement of the finished answer. */}
              <div aria-live="polite" className="sr-only">
                {announcedAnswer}
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

            {/* Composer footer — only once a conversation exists; the shared
                layoutId flies the composer down from the welcome screen. */}
            {hasMessages && (
              <div className="px-4 pb-4 pt-2 border-t border-[var(--lo1-gold)]/10 bg-[var(--lo1-void)]/40 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto">{composerElement}</div>
              </div>
            )}
          </div>
          </LayoutGroup>
        </ErrorBoundary>
      </NavigationWrapper>

      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleConfirmNewChat}
        onCancel={() => setConfirmOpen(false)}
        title={tc("title")}
        message={tc("message")}
        confirmText={tc("confirm")}
        cancelText={tc("cancel")}
      />
    </main>
  );
}
