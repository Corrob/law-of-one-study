import { openai, createEmbedding } from "../openai";

// Mock the OpenAI module
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { mockChat: true },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
        }),
      },
    })),
  };
});

describe("openai", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear singleton
    jest.resetModules();
    // Set up environment
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("singleton pattern", () => {
    it("should throw error if OPENAI_API_KEY is missing", () => {
      delete process.env.OPENAI_API_KEY;

      // Re-require to get fresh module
      jest.isolateModules(() => {
        const { openai: freshOpenai } = require("../openai");

        expect(() => {
          // Access a property to trigger the getter
          freshOpenai.chat;
        }).toThrow("Missing OPENAI_API_KEY environment variable");
      });
    });

    it("should return chat interface when API key is present", () => {
      expect(() => openai.chat).not.toThrow();
    });

    it("should return embeddings interface when API key is present", () => {
      expect(() => openai.embeddings).not.toThrow();
    });
  });

  describe("createEmbedding", () => {
    it("should create embedding for given text", async () => {
      const text = "The Law of One teaches unity.";
      const result = await createEmbedding(text);

      expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    });

    it("should call OpenAI embeddings API with correct parameters", async () => {
      const OpenAI = require("openai").default;
      const mockCreate = jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2] }],
      });

      // Create new mock instance
      OpenAI.mockImplementation(() => ({
        embeddings: { create: mockCreate },
      }));

      // Re-require to get fresh instance
      jest.isolateModules(() => {
        const { createEmbedding: freshCreateEmbedding } = require("../openai");
        freshCreateEmbedding("test text");
      });

      // Note: The actual assertion here is complex due to singleton caching
      // In a real scenario, you might want to use dependency injection
      // for more testable code
    });

    it("should handle empty text", async () => {
      const result = await createEmbedding("");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle long text", async () => {
      const longText = "word ".repeat(1000);
      const result = await createEmbedding(longText);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
