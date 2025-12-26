// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock environment variables
process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://test.posthog.com";

// Polyfill Request for Node.js environment
if (typeof Request === "undefined") {
  global.Request = class Request {
    constructor(input, init) {
      this.url = input;
      this.method = init?.method || "GET";
      this._headers = {};

      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }

      this.headers = {
        get: (key) => this._headers[key.toLowerCase()] || null,
      };
    }
  };
}
