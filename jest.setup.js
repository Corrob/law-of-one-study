// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key'
process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://test.posthog.com'
