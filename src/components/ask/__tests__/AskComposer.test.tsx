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

  it("does not send while disabled", async () => {
    const onSend = jest.fn();
    const user = userEvent.setup();
    render(<AskComposer onSend={onSend} disabled={true} />);

    const input = screen.getByLabelText("inputLabel");
    await user.type(input, "A question{Enter}");

    expect(onSend).not.toHaveBeenCalled();
  });
});
