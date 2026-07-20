import {
  exportAskChatToMarkdown,
  exportFilename,
  formatExportDate,
} from "../export-markdown";
import type { AskMessage } from "@/hooks/useAskStream";

const LABELS = {
  title: "Law of One Study — Ask Conversation",
  exportedOn: "Exported on July 12, 2026",
  you: "You",
  guide: "Guide",
};

const msg = (role: AskMessage["role"], content: string, disclaimer?: string): AskMessage => ({
  id: `${role}-${content.slice(0, 8)}`,
  role,
  content,
  disclaimer,
});

describe("exportAskChatToMarkdown", () => {
  it("renders title, byline and alternating sections", () => {
    const markdown = exportAskChatToMarkdown(
      [msg("user", "What is harvest?"), msg("assistant", "A transition between densities.")],
      "en",
      LABELS
    );

    expect(markdown).toContain("# Law of One Study — Ask Conversation");
    expect(markdown).toContain("_Exported on July 12, 2026_");
    expect(markdown.indexOf("## You")).toBeLessThan(markdown.indexOf("## Guide"));
    expect(markdown).toContain("What is harvest?");
    expect(markdown).toContain("A transition between densities.");
  });

  it("converts known citation markers to llresearch.org links and drops unknown ones", () => {
    const markdown = exportAskChatToMarkdown(
      [msg("assistant", "The harvest {{CITE:6.14}} and a fake one {{CITE:999.99}}.")],
      "en",
      LABELS
    );

    expect(markdown).toContain("[6.14](https://www.llresearch.org/channeling/ra-contact/6#14)");
    expect(markdown).not.toContain("999.99");
    expect(markdown).not.toContain("{{CITE");
  });

  it("includes the discernment note as italics and skips in-flight empty messages", () => {
    const markdown = exportAskChatToMarkdown(
      [
        msg("assistant", "An answer.", "Trust your own discernment."),
        msg("assistant", ""), // streaming placeholder
      ],
      "en",
      LABELS
    );

    expect(markdown).toContain("_Trust your own discernment._");
    expect(markdown.match(/## Guide/g)).toHaveLength(1);
  });

  it("uses locale-aware citation links", () => {
    const markdown = exportAskChatToMarkdown([msg("assistant", "La cosecha {{CITE:6.14}}.")], "es", LABELS);
    expect(markdown).toContain("https://www.llresearch.org/es/channeling/ra-contact/6#14");
  });
});

describe("exportFilename", () => {
  it("builds a timestamped markdown filename in local time", () => {
    // Constructed without a zone suffix, so this is 09:05 local — date and
    // time must come from the same clock (no UTC/local mismatch at midnight).
    const name = exportFilename(new Date("2026-07-12T09:05:00"));
    expect(name).toBe("law-of-one-ask-2026-07-12-0905.md");
  });
});

describe("formatExportDate", () => {
  it("formats per locale", () => {
    expect(formatExportDate("en")).toMatch(/\d{4}/);
    expect(formatExportDate("de")).toMatch(/\d{4}/);
  });
});
