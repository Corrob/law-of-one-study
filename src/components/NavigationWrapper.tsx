"use client";

import { useState, useCallback } from "react";
import Header from "./Header";
import BurgerMenu from "./BurgerMenu";

interface NavigationWrapperProps {
  children: React.ReactNode;
}

export default function NavigationWrapper({
  children,
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
      <Header onMenuClick={handleMenuOpen} />
      <BurgerMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
      {children}
    </>
  );
}
