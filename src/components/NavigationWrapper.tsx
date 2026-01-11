"use client";

import { useState, useCallback } from "react";
import Header from "./Header";
import BurgerMenu from "./BurgerMenu";

interface NavigationWrapperProps {
  children: React.ReactNode;
  showNewChat?: boolean;
  onNewChat?: () => void;
  showNewSearch?: boolean;
  onNewSearch?: () => void;
}

export default function NavigationWrapper({
  children,
  showNewChat,
  onNewChat,
  showNewSearch,
  onNewSearch,
}: NavigationWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuOpen = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <Header
        onMenuClick={handleMenuOpen}
        showNewChat={showNewChat}
        onNewChat={onNewChat}
        showNewSearch={showNewSearch}
        onNewSearch={onNewSearch}
      />
      <BurgerMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
      {children}
    </>
  );
}
