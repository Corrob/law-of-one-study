import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChannelingIndex, { type IndexTheme } from "../ChannelingIndex";

// next-intl: echo keys; interpolate {count}.
jest.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, vals?: Record<string, unknown>) =>
      vals && "count" in vals ? `${vals.count} themes` : key;
    return t;
  },
}));

// Localized Link → plain anchor.
jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const THEMES: IndexTheme[] = [
  {
    id: "meditation-and-silence",
    title: "Meditation & Silence",
    teaser: "Consenting to silence.",
    sources: ["Q'uo", "Hatonn"],
    count: 2,
    search: "meditation & silence consenting to silence meditate stillness",
  },
  {
    id: "grief-and-loss",
    title: "Grief & Loss",
    teaser: "There is no true loss.",
    sources: ["Q'uo"],
    count: 2,
    search: "grief & loss there is no true loss mourning bereavement",
  },
  {
    id: "time-and-the-present",
    title: "Time & the Present",
    teaser: "All is now.",
    sources: ["Q'uo", "Latwii"],
    count: 2,
    search: "time & the present all is now",
  },
];

describe("ChannelingIndex", () => {
  it("renders a card linking to each theme's detail page", () => {
    render(<ChannelingIndex themes={THEMES} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(THEMES.length);
    expect(screen.getByText("Meditation & Silence").closest("a")).toHaveAttribute(
      "href",
      "/channeling/meditation-and-silence"
    );
  });

  it("filters by search query against title/summary/aliases", async () => {
    const user = userEvent.setup();
    render(<ChannelingIndex themes={THEMES} />);
    await user.type(screen.getByLabelText("searchLabel"), "mourning");
    expect(screen.getByText("Grief & Loss")).toBeInTheDocument();
    expect(screen.queryByText("Meditation & Silence")).not.toBeInTheDocument();
  });

  it("filters by voice (source) chip", async () => {
    const user = userEvent.setup();
    render(<ChannelingIndex themes={THEMES} />);
    // Latwii appears on only one theme.
    await user.click(screen.getByRole("button", { name: "Latwii" }));
    expect(screen.getByText("Time & the Present")).toBeInTheDocument();
    expect(screen.queryByText("Grief & Loss")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<ChannelingIndex themes={THEMES} />);
    await user.type(screen.getByLabelText("searchLabel"), "zzzznope");
    expect(screen.getByText("noResults")).toBeInTheDocument();
  });
});
