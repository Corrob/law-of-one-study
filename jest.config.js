const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Transform D3 and related ESM modules
  transformIgnorePatterns: [
    "/node_modules/(?!(d3|d3-.*|d3dag|internmap|delaunator|robust-predicates)/)",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
    // Exclude files that are difficult to test or low-value
    "!src/providers/**",         // PostHog requires browser environment
    "!src/contexts/**",          // React contexts tested via component tests
    "!src/data/placeholders.ts", // Static data
    "!src/data/starters.ts",     // Static data
    "!src/app/**/layout.tsx",    // Next.js layouts
    "!src/app/**/error.tsx",     // Next.js error boundaries
    "!src/app/**/loading.tsx",   // Next.js loading states
    "!src/**/index.ts",          // Re-export files
    "!src/lib/posthog-server.ts", // PostHog server requires env
  ],
  coverageThreshold: {
    // Global thresholds - achievable with current test coverage
    global: {
      branches: 55,
      functions: 55,
      lines: 60,
      statements: 60,
    },
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
