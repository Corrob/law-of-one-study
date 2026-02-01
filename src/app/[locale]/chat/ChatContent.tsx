"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import NavigationWrapper from "@/components/NavigationWrapper";
import ChatInterface, { ChatInterfaceRef } from "@/components/ChatInterface";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConfirmModal from "@/components/ConfirmModal";
import { exportChatToMarkdown, downloadMarkdown } from "@/lib/chat/export-markdown";

export default function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || undefined;
  const t = useTranslations("confirmNewChat");
  const locale = useLocale();

  const chatRef = useRef<ChatInterfaceRef>(null);
  const [hasMessages, setHasMessages] = useState(false);
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleNewChat = useCallback(() => {
    if (hasMessages) {
      setShowConfirmModal(true);
    }
  }, [hasMessages]);

  const handleConfirmNewChat = useCallback(() => {
    chatRef.current?.reset();
    setHasMessages(false);
    setShowConfirmModal(false);
  }, []);

  const handleCancelNewChat = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  const handleExportChat = useCallback(() => {
    const messages = chatRef.current?.getMessages();
    if (!messages || messages.length === 0) return;
    const markdown = exportChatToMarkdown(messages, locale);
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5).replace(":", "");
    downloadMarkdown(markdown, `law-of-one-seek-${date}-${time}.md`);
  }, [locale]);

  // Keyboard shortcut: Cmd/Ctrl + Shift + O for new chat (matches ChatGPT)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "o") {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewChat]);

  const handleMessagesChange = useCallback((messageCount: number) => {
    setHasMessages(messageCount > 0);
  }, []);

  const handleStreamingChange = useCallback((streaming: boolean) => {
    setIsChatStreaming(streaming);
  }, []);

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavigationWrapper showNewChat={hasMessages} onNewChat={handleNewChat} showExportChat={hasMessages} onExportChat={handleExportChat} disableExportChat={isChatStreaming}>
        <div className="flex-1 overflow-hidden relative z-10">
          <ErrorBoundary>
            <ChatInterface
              ref={chatRef}
              onMessagesChange={handleMessagesChange}
              onStreamingChange={handleStreamingChange}
              initialQuery={initialQuery}
            />
          </ErrorBoundary>
        </div>
      </NavigationWrapper>
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmNewChat}
        onCancel={handleCancelNewChat}
        title={t("title")}
        message={t("message")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
      />
    </main>
  );
}
