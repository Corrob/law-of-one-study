import { render, screen } from "@testing-library/react";

// react-markdown is ESM-only (untransformed under next/jest), so mock it with a
// minimal renderer: enough to exercise AskAnswer's custom `a` component, which
// is what these tests are about. Markdown conversion itself is unit-tested in
// src/lib/ask/__tests__/resource-links.test.ts.
jest.mock("react-markdown", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  interface MockProps {
    children: string;
    components?: {
      a?: (props: { href: string; children: React.ReactNode }) => React.ReactNode;
    };
  }
  return {
    __esModule: true,
    default: ({ children, components }: MockProps) => {
      const parts: React.ReactNode[] = [];
      let last = 0;
      const linkPattern = /\[([^\]]*)\]\(([^)]*)\)/g;
      for (const match of children.matchAll(linkPattern)) {
        parts.push(children.slice(last, match.index));
        const [, text, href] = match;
        const anchor = components?.a
          ? components.a({ href, children: text })
          : React.createElement("a", { href }, text);
        parts.push(React.createElement(React.Fragment, { key: match.index }, anchor));
        last = match.index + match[0].length;
      }
      parts.push(children.slice(last));
      return React.createElement("div", null, ...parts);
    },
  };
});
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => undefined }));

import AskAnswer from "../AskAnswer";

// Mock @/i18n/navigation — Link renders a plain anchor so we can assert hrefs.
jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-internal-link {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("AskAnswer", () => {
  it("renders a citation marker as an external chip link", () => {
    render(<AskAnswer content="Balance matters {{CITE:5.2}}." />);
    const link = screen.getByRole("link", { name: "5.2" });
    expect(link).toHaveAttribute("href", "https://www.llresearch.org/channeling/ra-contact/5#2");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders a resource marker as an internal link without target=_blank", () => {
    render(<AskAnswer content="Try {{LINK:meditation:balancing-the-self}} tonight." />);
    const link = screen.getByRole("link", { name: "Balancing the Self" });
    expect(link).toHaveAttribute("href", "/meditate?meditation=balancing-the-self");
    expect(link).not.toHaveAttribute("target");
    expect(link).toHaveAttribute("data-internal-link");
  });

  it("drops unknown resource markers entirely", () => {
    render(<AskAnswer content="Try {{LINK:meditation:made-up}} tonight." />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/Try\s*tonight\./)).toBeInTheDocument();
  });

  it("hides a partial trailing marker mid-stream", () => {
    render(<AskAnswer content="Here is a thought {{LINK:medita" />);
    expect(screen.getByText(/Here is a thought/)).toBeInTheDocument();
    expect(screen.queryByText(/\{\{/)).not.toBeInTheDocument();
  });

  it("renders external non-citation links with target=_blank", () => {
    render(<AskAnswer content="See [here](https://example.com)." />);
    const link = screen.getByRole("link", { name: "here" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).not.toHaveAttribute("data-internal-link");
  });
});
