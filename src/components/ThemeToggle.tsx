'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    // Placeholder to prevent layout shift
    return (
      <div className="h-9 w-40 rounded-full bg-[var(--lo1-void)]/50" />
    );
  }

  return (
    <div
      className="inline-flex rounded-full p-1 bg-[var(--lo1-void)]/80 border border-[var(--lo1-celestial)]/20"
      role="radiogroup"
      aria-label="Theme selection"
    >
      <button
        onClick={() => theme !== 'dark' && toggleTheme()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
          ${theme === 'dark'
            ? 'bg-[var(--lo1-indigo)] text-[var(--lo1-gold)] shadow-sm'
            : 'text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)]'
          }`}
        role="radio"
        aria-checked={theme === 'dark'}
        aria-label="Dark mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <span>Dark</span>
      </button>
      <button
        onClick={() => theme !== 'light' && toggleTheme()}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
          ${theme === 'light'
            ? 'bg-[var(--lo1-indigo)] text-[var(--lo1-gold)] shadow-sm'
            : 'text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)]'
          }`}
        role="radio"
        aria-checked={theme === 'light'}
        aria-label="Light mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
        <span>Light</span>
      </button>
    </div>
  );
}
