import { render, screen } from "@testing-library/react";
import AskRelatedResources from "../AskRelatedResources";
import type { RelatedResource } from "@/lib/ask/resources";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const ITEMS: RelatedResource[] = [
  { type: "path", id: "densities", title: "The Seven Densities", href: "/paths/densities" },
  {
    type: "meditation",
    id: "balancing-the-self",
    title: "Balancing the Self",
    href: "/meditate?meditation=balancing-the-self",
  },
  { type: "song", id: "gateway", title: "Gateway", href: "/listen?song=gateway" },
  { type: "concept", id: "harvest", title: "Harvest", href: "/explore?concept=harvest" },
];

describe("AskRelatedResources", () => {
  it("renders cards with titles and internal hrefs, capped at 3", () => {
    render(<AskRelatedResources items={ITEMS} excludeInline={[]} />);
    const cards = screen.getAllByTestId("ask-related-card");
    expect(cards).toHaveLength(3);
    expect(screen.getByRole("link", { name: /The Seven Densities/ })).toHaveAttribute(
      "href",
      "/paths/densities"
    );
  });

  it("dedupes against inline links", () => {
    render(
      <AskRelatedResources
        items={ITEMS}
        excludeInline={[{ type: "path", id: "densities" }]}
      />
    );
    expect(screen.queryByText("The Seven Densities")).not.toBeInTheDocument();
    // With the path excluded, the concept card is promoted into the cap of 3.
    expect(screen.getAllByTestId("ask-related-card")).toHaveLength(3);
    expect(screen.getByText("Harvest")).toBeInTheDocument();
  });

  it("renders nothing when every item is excluded", () => {
    render(
      <AskRelatedResources
        items={[ITEMS[2]]}
        excludeInline={[{ type: "song", id: "gateway" }]}
      />
    );
    expect(screen.queryByTestId("ask-related")).not.toBeInTheDocument();
  });
});
