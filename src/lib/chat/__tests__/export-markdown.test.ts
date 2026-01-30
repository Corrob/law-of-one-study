import { exportChatToMarkdown, downloadMarkdown } from "../export-markdown";
import type { Message } from "@/lib/types";

describe("exportChatToMarkdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-15T14:30:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns header with title and export date", () => {
    const result = exportChatToMarkdown([]);

    expect(result).toContain("# Law of One Study — Seek Conversation");
    expect(result).toContain("_Exported on June 15, 2025_");
  });

  it("formats date using the provided locale", () => {
    const esResult = exportChatToMarkdown([], "es");
    expect(esResult).toContain("_Exported on 15 de junio de 2025_");

    const deResult = exportChatToMarkdown([], "de");
    expect(deResult).toContain("_Exported on 15. Juni 2025_");

    const frResult = exportChatToMarkdown([], "fr");
    expect(frResult).toContain("_Exported on 15 juin 2025_");
  });

  it("defaults to en-US date format when no locale provided", () => {
    const result = exportChatToMarkdown([]);
    expect(result).toContain("_Exported on June 15, 2025_");
  });

  it("renders user messages with You heading", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "user",
        content: "What is the Law of One?",
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("## You");
    expect(result).toContain("What is the Law of One?");
  });

  it("renders assistant messages with Companion heading", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "The Law of One states that all things are one.",
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("## Companion");
    expect(result).toContain("The Law of One states that all things are one.");
  });

  it("renders assistant text segments as-is", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "Here is an explanation.",
        segments: [
          { type: "text", content: "Here is an explanation." },
        ],
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("## Companion");
    expect(result).toContain("Here is an explanation.");
  });

  it("renders quote segments as blockquotes with reference links", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        segments: [
          { type: "text", content: "Ra says:" },
          {
            type: "quote",
            quote: {
              text: "All is one.",
              reference: "1.1",
              url: "https://lawofone.info/s/1#1",
            },
          },
        ],
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("> All is one.");
    expect(result).toContain(">");
    expect(result).toContain("> — [1.1](https://lawofone.info/s/1#1)");
  });

  it("handles multi-line quote text with blockquote prefix on each line", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        segments: [
          {
            type: "quote",
            quote: {
              text: "I am Ra.\nAll is one.\nThere is no polarity.",
              reference: "1.1",
              url: "https://lawofone.info/s/1#1",
            },
          },
        ],
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("> I am Ra.\n> All is one.\n> There is no polarity.");
    expect(result).toContain("> — [1.1](https://lawofone.info/s/1#1)");
  });

  it("falls back to content when segments are empty", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "Fallback content here.",
        segments: [],
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("Fallback content here.");
  });

  it("falls back to content when segments are undefined", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "No segments at all.",
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("No segments at all.");
  });

  it("renders a full multi-turn conversation in order", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "user",
        content: "What are densities?",
        timestamp: new Date(),
      },
      {
        id: "2",
        role: "assistant",
        content: "Densities are levels of consciousness.",
        segments: [
          { type: "text", content: "Densities are levels of consciousness." },
          {
            type: "quote",
            quote: {
              text: "The first density is the density of awareness.",
              reference: "13.16",
              url: "https://lawofone.info/s/13#16",
            },
          },
        ],
        timestamp: new Date(),
      },
      {
        id: "3",
        role: "user",
        content: "Tell me about third density.",
        timestamp: new Date(),
      },
      {
        id: "4",
        role: "assistant",
        content: "Third density is the density of self-awareness.",
        segments: [
          { type: "text", content: "Third density is the density of self-awareness." },
        ],
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    // Check ordering: first user, first assistant, second user, second assistant
    const youIndices = [...result.matchAll(/## You/g)].map((m) => m.index);
    const companionIndices = [...result.matchAll(/## Companion/g)].map((m) => m.index);

    expect(youIndices).toHaveLength(2);
    expect(companionIndices).toHaveLength(2);
    expect(youIndices[0]).toBeLessThan(companionIndices[0]!);
    expect(companionIndices[0]).toBeLessThan(youIndices[1]!);
    expect(youIndices[1]).toBeLessThan(companionIndices[1]!);

    // Check content is present
    expect(result).toContain("What are densities?");
    expect(result).toContain("Densities are levels of consciousness.");
    expect(result).toContain("> The first density is the density of awareness.");
    expect(result).toContain("Tell me about third density.");
    expect(result).toContain("Third density is the density of self-awareness.");
  });

  it("handles multiple quote segments in one assistant message", () => {
    const messages: Message[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        segments: [
          { type: "text", content: "Two relevant quotes:" },
          {
            type: "quote",
            quote: {
              text: "First quote.",
              reference: "1.1",
              url: "https://lawofone.info/s/1#1",
            },
          },
          {
            type: "quote",
            quote: {
              text: "Second quote.",
              reference: "2.2",
              url: "https://lawofone.info/s/2#2",
            },
          },
        ],
        timestamp: new Date(),
      },
    ];

    const result = exportChatToMarkdown(messages);

    expect(result).toContain("> First quote.");
    expect(result).toContain("> — [1.1](https://lawofone.info/s/1#1)");
    expect(result).toContain("> Second quote.");
    expect(result).toContain("> — [2.2](https://lawofone.info/s/2#2)");
  });
});

describe("downloadMarkdown", () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let createElementSpy: jest.SpyInstance;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    appendChildSpy?.mockRestore();
    removeChildSpy?.mockRestore();
    createElementSpy?.mockRestore();
  });

  it("creates a blob, triggers download, and cleans up", () => {
    const revokeObjectURL = jest.fn();
    const createObjectURL = jest.fn(() => "blob:mock-url");
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const clickSpy = jest.fn();
    appendChildSpy = jest.spyOn(document.body, "appendChild");
    removeChildSpy = jest.spyOn(document.body, "removeChild");

    // Mock createElement to capture the anchor
    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        el.click = clickSpy;
      }
      return el;
    });

    downloadMarkdown("# Test content", "test-export.md");

    // Verify blob was created and URL generated
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));

    // Verify anchor was added, clicked, and removed
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    // Verify cleanup
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

    // Verify the anchor had correct properties
    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.href).toContain("blob:mock-url");
    expect(anchor.download).toBe("test-export.md");
  });
});
