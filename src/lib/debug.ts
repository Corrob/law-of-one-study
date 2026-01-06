// Debug logging utility - only logs in development mode

const isDev = process.env.NODE_ENV !== "production";

export const debug = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: unknown[]) => {
    // Always log errors
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
};
