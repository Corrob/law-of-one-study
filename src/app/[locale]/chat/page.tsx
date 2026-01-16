"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import NavigationWrapper from "@/components/NavigationWrapper";
import ChatInterface, { ChatInterfaceRef } from "@/components/ChatInterface";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConfirmModal from "@/components/ConfirmModal";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || undefined;

  const chatRef = useRef<ChatInterfaceRef>(null);
  const [hasMessages, setHasMessages] = useState(false);
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

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      <NavigationWrapper showNewChat={hasMessages} onNewChat={handleNewChat}>
        <div className="flex-1 overflow-hidden relative z-10">
          <ErrorBoundary>
            <ChatInterface
              ref={chatRef}
              onMessagesChange={handleMessagesChange}
              initialQuery={initialQuery}
            />
          </ErrorBoundary>
        </div>
      </NavigationWrapper>
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmNewChat}
        onCancel={handleCancelNewChat}
        title="Start a new conversation?"
        message="Your current conversation will be cleared. This cannot be undone."
        confirmText="Start New"
        cancelText="Keep Chatting"
      />
    </main>
  );
}
