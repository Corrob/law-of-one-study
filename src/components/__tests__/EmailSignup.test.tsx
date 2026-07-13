import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailSignup, {
  EMAIL_SIGNUP_DISMISSED_KEY,
  EMAIL_SIGNUP_SUBSCRIBED_KEY,
} from "../EmailSignup";
import posthog from "posthog-js";

// Mock next-intl
jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      description: "Receive a quote from the Ra Material in your inbox each week.",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      subscribe: "Subscribe",
      submitting: "Subscribing…",
      success: "You are subscribed 🙏 Check your inbox to confirm.",
      error: "Something went wrong. Please try again.",
      privacyNote: "We store only your email and language.",
      dismiss: "Dismiss email signup",
    };
    return translations[key] ?? key;
  },
}));

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as jest.Mock;
}

describe("EmailSignup", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders the signup form and fires a viewed event", () => {
    render(<EmailSignup />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
    expect(posthog.capture).toHaveBeenCalledWith("email_signup_viewed");
  });

  it("does not render when previously dismissed", () => {
    localStorage.setItem(EMAIL_SIGNUP_DISMISSED_KEY, "1");
    const { container } = render(<EmailSignup />);
    expect(container).toBeEmptyDOMElement();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("does not render when previously subscribed", () => {
    localStorage.setItem(EMAIL_SIGNUP_SUBSCRIBED_KEY, "1");
    const { container } = render(<EmailSignup />);
    expect(container).toBeEmptyDOMElement();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("dismisses and remembers the choice in localStorage", async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailSignup />);

    await user.click(screen.getByRole("button", { name: "Dismiss email signup" }));

    expect(container).toBeEmptyDOMElement();
    expect(localStorage.getItem(EMAIL_SIGNUP_DISMISSED_KEY)).toBe("1");
  });

  it("submits the email and shows the success state", async () => {
    mockFetchOnce({ status: "ok" });
    const user = userEvent.setup();
    render(<EmailSignup />);

    await user.type(screen.getByLabelText("Email address"), "seeker@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() =>
      expect(
        screen.getByText("You are subscribed 🙏 Check your inbox to confirm.")
      ).toBeInTheDocument()
    );

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/subscribe");
    expect(JSON.parse(init.body)).toEqual({
      email: "seeker@example.com",
      locale: "en",
      website: "",
    });
    expect(posthog.capture).toHaveBeenCalledWith("email_signup_completed", {
      locale: "en",
    });
    expect(localStorage.getItem(EMAIL_SIGNUP_SUBSCRIBED_KEY)).toBe("1");
  });

  it("shows an error message when the API rejects", async () => {
    mockFetchOnce({ status: "error", message: "nope" }, false);
    const user = userEvent.setup();
    render(<EmailSignup />);

    await user.type(screen.getByLabelText("Email address"), "seeker@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
  });

  it("shows an error message when the network fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as jest.Mock;
    const user = userEvent.setup();
    render(<EmailSignup />);

    await user.type(screen.getByLabelText("Email address"), "seeker@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
