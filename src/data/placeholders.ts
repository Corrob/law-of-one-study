// Dynamic placeholder messages for the input field

// Initial placeholders (before any conversation)
export const initialPlaceholders = [
  "Seek and you shall find...",
  "What mystery calls to you?",
  "Ask what your heart wishes to know...",
  "Begin your journey into the Law of One...",
];

// Follow-up placeholders (during conversation)
export const followUpPlaceholders = [
  "Go deeper...",
  "What else would you like to explore?",
  "Ask a follow-up question...",
  "Continue your seeking...",
  "What resonates with you?",
  "Explore further...",
  "What calls to your attention?",
];

// Default placeholder for SSR (deterministic to avoid hydration mismatch)
export const defaultPlaceholder = initialPlaceholders[0];

// Get a random placeholder from an array (client-side only)
function getRandomFrom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Get appropriate placeholder based on message count (call only on client after hydration)
export function getPlaceholder(messageCount: number): string {
  if (messageCount === 0) {
    return getRandomFrom(initialPlaceholders);
  }
  return getRandomFrom(followUpPlaceholders);
}
