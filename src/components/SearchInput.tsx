"use client";

import { KeyboardEvent } from "react";
import { SearchIcon } from "./icons";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  placeholder?: string;
  /** Compact mode for results header */
  compact?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = "Search the Ra Material...",
  compact = false,
}: SearchInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  const isDisabled = isLoading || value.trim().length < 2;

  return (
    <div
      className="relative flex items-center rounded-2xl border border-[var(--lo1-celestial)]/30
                 bg-[var(--lo1-deep-space)]/80
                 focus-within:ring-2 focus-within:ring-[var(--lo1-gold)] focus-within:border-transparent
                 transition-all duration-200"
    >
      <SearchIcon className="absolute left-4 w-5 h-5 text-[var(--lo1-stardust)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`flex-1 bg-transparent pl-12 pr-4
                   text-[var(--lo1-starlight)] placeholder:text-[var(--lo1-stardust)]
                   focus:outline-none ${compact ? "py-3" : "py-4"}`}
        aria-label="Search query"
      />
      {value && (
        <button
          onClick={onSearch}
          disabled={isDisabled}
          className={`mr-2 rounded-xl bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)]
                     font-medium hover:bg-[var(--lo1-gold-light)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 cursor-pointer
                     ${compact ? "px-4 py-1.5 text-sm" : "px-4 py-2"}`}
        >
          {isLoading ? "..." : "Search"}
        </button>
      )}
    </div>
  );
}
