import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AskWelcome from "../AskWelcome";

// next-intl: return keys/raw values without a provider.
jest.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.raw = (key: string) =>
      key === "starters" ? ["What is the harvest?", "What are densities?", "Who is Ra?"] : key;
    return t;
  },
}));

jest.mock("@/lib/ask/analytics", () => ({
  askAnalytics: {
    welcomeScreenViewed: jest.fn(),
    conversationStarterClicked: jest.fn(),
  },
}));

describe("AskWelcome", () => {
  it("renders the composer slot between the intro and the starter questions", () => {
    render(
      <AskWelcome onPickStarter={jest.fn()} composer={<textarea aria-label="composer-slot" />} />
    );

    const composer = screen.getByLabelText("composer-slot");
    const starters = screen.getAllByTestId("ask-starter");
    expect(starters.length).toBeGreaterThan(0);

    // The composer must appear BEFORE the starters in document order —
    // starters read as suggestions for the input, not a separate menu.
    for (const starter of starters) {
      expect(
        composer.compareDocumentPosition(starter) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it("renders without a composer (slot is optional)", () => {
    render(<AskWelcome onPickStarter={jest.fn()} />);
    expect(screen.getAllByTestId("ask-starter").length).toBeGreaterThan(0);
  });

  it("forwards starter clicks to onPickStarter", async () => {
    const onPickStarter = jest.fn();
    render(<AskWelcome onPickStarter={onPickStarter} />);

    const first = screen.getAllByTestId("ask-starter")[0];
    await userEvent.click(first);
    expect(onPickStarter).toHaveBeenCalledWith(first.textContent);
  });
});
