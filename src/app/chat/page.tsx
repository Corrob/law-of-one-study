"use client";

import { useRef, useState, useCallback } from "react";
import NavigationWrapper from "@/components/NavigationWrapper";
import ChatInterface, { ChatInterfaceRef } from "@/components/ChatInterface";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ChatPage() {
  const chatRef = useRef<ChatInterfaceRef>(null);
  const [hasMessages, setHasMessages] = useState(false);

  const handleNewChat = useCallback(() => {
    if (hasMessages) {
      // TODO: Add confirmation dialog
      chatRef.current?.reset();
      setHasMessages(false);
    }
  }, [hasMessages]);

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
            />
          </ErrorBoundary>
        </div>
      </NavigationWrapper>
    </main>
  );
}
