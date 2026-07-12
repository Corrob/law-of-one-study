import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AskCopyButton from "../AskCopyButton";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const strings: Record<string, string> = { copy: "Copy", copied: "Copied" };
    return strings[key] ?? key;
  },
}));

describe("AskCopyButton", () => {
  const writeText = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it("copies the text and shows transient feedback", async () => {
    jest.useFakeTimers();
    render(<AskCopyButton text="The harvest [6.14](https://example.org)" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("The harvest [6.14](https://example.org)");
    await waitFor(() => expect(screen.getByText("Copied")).toBeInTheDocument());

    // Feedback resets after the timeout.
    act(() => jest.advanceTimersByTime(2100));
    expect(screen.getByText("Copy")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("stays quiet when the clipboard is unavailable", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<AskCopyButton text="text" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});
