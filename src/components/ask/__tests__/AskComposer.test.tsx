import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AskComposer from "../AskComposer";

// next-intl: return keys/raw values without a provider.
jest.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.raw = (key: string) => (key === "placeholders" ? ["placeholder"] : key);
    return t;
  },
}));

describe("AskComposer", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the composer queries it to decide whether to
    // dismiss the mobile keyboard after sending.
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  });

  it("sends the typed message and clears the input", async () => {
    const onSend = jest.fn();
    const user = userEvent.setup();
    render(<AskComposer onSend={onSend} disabled={false} />);

    const input = screen.getByLabelText("inputLabel");
    await user.type(input, "What is the Law of One?{Enter}");

    expect(onSend).toHaveBeenCalledWith("What is the Law of One?");
    expect(input).toHaveValue("");
  });

  it("pre-fills and focuses the input when initialValue is provided", () => {
    render(
      <AskComposer
        onSend={jest.fn()}
        disabled={false}
        initialValue='Please help me understand Ra 1.7: "All is one."'
      />
    );

    const input = screen.getByLabelText("inputLabel");
    expect(input).toHaveValue('Please help me understand Ra 1.7: "All is one."');
    expect(input).toHaveFocus();
  });

  it("sends the pre-filled question with a single Enter", async () => {
    const onSend = jest.fn();
    const user = userEvent.setup();
    render(<AskComposer onSend={onSend} disabled={false} initialValue="Prefilled question" />);

    await user.keyboard("{Enter}");

    expect(onSend).toHaveBeenCalledWith("Prefilled question");
  });
});
