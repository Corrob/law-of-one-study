// Dynamic placeholder messages for the input field

// Initial placeholders (before any conversation)
// Keep under ~28 chars to fit mobile screens
export const initialPlaceholders = [
  "Seek and you shall find...",
  "What mystery calls to you?",
  "What do you wish to know?",
  "Begin your journey...",
];

// Follow-up placeholders (during conversation)
// Keep under ~28 chars to fit mobile screens
export const followUpPlaceholders = [
  "Go deeper...",
  "What else calls to you?",
  "Ask a follow-up...",
  "Continue your seeking...",
  "What resonates with you?",
  "Explore further...",
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
