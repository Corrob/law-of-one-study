"use client";

import { Children, isValidElement, cloneElement } from "react";

interface MotionStaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child animation */
  staggerDelay?: number;
}

interface MotionStaggerItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Client wrapper for staggered child animations.
 * Uses CSS animations instead of framer-motion for lighter bundle.
 * Wrap the parent in MotionStaggerGroup and each child in MotionStaggerItem.
 */
export function MotionStaggerGroup({
  children,
  className,
  staggerDelay = 0.1,
}: MotionStaggerGroupProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => {
        if (!isValidElement<MotionStaggerItemProps>(child)) return child;
        return cloneElement(child, {
          style: {
            ...child.props.style,
            animationDelay: `${i * staggerDelay}s`,
          },
        });
      })}
    </div>
  );
}

export function MotionStaggerItem({ children, className, style }: MotionStaggerItemProps) {
  return (
    <div className={`animate-opacity-fade-in ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
