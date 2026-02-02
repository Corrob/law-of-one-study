export default function NavBarSkeleton() {
  return (
    <div className="relative z-10 bg-[var(--lo1-indigo)]/80 text-white py-3 px-4 border-b border-[var(--lo1-gold)]/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--lo1-celestial)]/10 animate-pulse" />
          <div className="h-5 w-24 rounded bg-[var(--lo1-celestial)]/10 animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-[var(--lo1-celestial)]/10 animate-pulse" />
      </div>
    </div>
  );
}
