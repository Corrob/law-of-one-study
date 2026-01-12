// Navigation and UI icons using Lucide-style SVGs
// All icons are 24x24 viewBox, currentColor for fill/stroke

interface IconProps {
  className?: string;
}

export function UnityIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      {/* Spiral representing unity/infinity */}
      <path
        d="M50 20
           C70 20, 80 35, 80 50
           C80 65, 65 75, 50 75
           C35 75, 25 62, 25 50
           C25 38, 35 30, 50 30
           C60 30, 68 40, 68 50
           C68 60, 58 67, 50 67
           C42 67, 35 58, 35 50
           C35 42, 43 37, 50 37"
        strokeLinecap="round"
      />
      {/* Central point */}
      <circle cx="50" cy="50" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ExploreIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      {/* Main large sparkle */}
      <path d="M12 1C12 1 13 7 13 9C13 11 12 12 12 12C12 12 11 11 11 9C11 7 12 1 12 1Z" />
      <path d="M12 12C12 12 13 13 15 13C17 13 23 12 23 12C23 12 17 11 15 11C13 11 12 12 12 12Z" />
      <path d="M12 12C12 12 11 13 11 15C11 17 12 23 12 23C12 23 13 17 13 15C13 13 12 12 12 12Z" />
      <path d="M12 12C12 12 11 11 9 11C7 11 1 12 1 12C1 12 7 13 9 13C11 13 12 12 12 12Z" />
      {/* Small sparkle top-right */}
      <path d="M19 2C19 2 19.3 3.5 19.3 4C19.3 4.5 19 5 19 5C19 5 18.7 4.5 18.7 4C18.7 3.5 19 2 19 2Z" />
      <path d="M19 5C19 5 19.5 5.3 20 5.3C20.5 5.3 22 5 22 5C22 5 20.5 4.7 20 4.7C19.5 4.7 19 5 19 5Z" />
      <path d="M19 5C19 5 18.5 5.3 18 5.3C17.5 5.3 16 5 16 5C16 5 17.5 4.7 18 4.7C18.5 4.7 19 5 19 5Z" />
      <path d="M19 5C19 5 19.3 5.5 19.3 6C19.3 6.5 19 8 19 8C19 8 18.7 6.5 18.7 6C18.7 5.5 19 5 19 5Z" />
      {/* Small sparkle bottom-left */}
      <path d="M5 16C5 16 5.2 17 5.2 17.3C5.2 17.6 5 18 5 18C5 18 4.8 17.6 4.8 17.3C4.8 17 5 16 5 16Z" />
      <path d="M5 18C5 18 5.4 18.2 5.7 18.2C6 18.2 7 18 7 18C7 18 6 17.8 5.7 17.8C5.4 17.8 5 18 5 18Z" />
      <path d="M5 18C5 18 4.6 18.2 4.3 18.2C4 18.2 3 18 3 18C3 18 4 17.8 4.3 17.8C4.6 17.8 5 18 5 18Z" />
      <path d="M5 18C5 18 5.2 18.4 5.2 18.7C5.2 19 5 20 5 20C5 20 4.8 19 4.8 18.7C4.8 18.4 5 18 5 18Z" />
    </svg>
  );
}
