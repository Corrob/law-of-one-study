"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface FeatureCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  index?: number;
}

export default function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
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
    </motion.div>
  );
}
