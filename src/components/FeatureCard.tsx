"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";

interface FeatureCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  index?: number;
}

const SESSION_KEY = "lo1-dashboard-seen";

export default function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  index = 0,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen) {
      // Skip animation on return visits — show immediately
      if (cardRef.current) {
        cardRef.current.style.opacity = "1";
        cardRef.current.style.transform = "translateY(0)";
      }
    } else {
      // First visit this session — animate, then mark as seen
      if (cardRef.current) {
        const delay = index * 80;
        cardRef.current.style.transition = `opacity 0.3s ease-out ${delay}ms, transform 0.3s ease-out ${delay}ms`;
        cardRef.current.style.opacity = "1";
        cardRef.current.style.transform = "translateY(0)";
      }
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  }, [index]);

  return (
    <div
      ref={cardRef}
      style={{ opacity: 0, transform: "translateY(16px)" }}
    >
      <Link
        href={href}
        className="group flex flex-col items-center justify-center text-center
                   aspect-square p-4 rounded-2xl
                   bg-[var(--lo1-indigo)]/60 backdrop-blur-sm
                   border border-[var(--lo1-celestial)]/30
                   shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                   hover:border-[var(--lo1-gold)]/50 hover:bg-[var(--lo1-indigo)]/80
                   hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_35px_rgba(212,168,83,0.15)]
                   hover:scale-[1.02]
                   transition-all duration-300"
      >
        <Icon className="w-8 h-8 text-[var(--lo1-gold)] mb-3" />
        <h3 className="text-base font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[var(--lo1-stardust)]">
          {description}
        </p>
      </Link>
    </div>
  );
}
