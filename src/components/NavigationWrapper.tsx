"use client";

import { useState, useCallback } from "react";
import Header from "./Header";
import BurgerMenu from "./BurgerMenu";

interface NavigationWrapperProps {
  children: React.ReactNode;
  showNewChat?: boolean;
  onNewChat?: () => void;
  showExportChat?: boolean;
  onExportChat?: () => void;
  disableExportChat?: boolean;
}

export default function NavigationWrapper({
  children,
  showNewChat,
  onNewChat,
  showExportChat,
  onExportChat,
  disableExportChat,
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
        showExportChat={showExportChat}
        onExportChat={onExportChat}
        disableExportChat={disableExportChat}
      />
      <BurgerMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
      {children}
    </>
  );
}
