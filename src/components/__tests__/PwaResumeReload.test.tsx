import { render } from "@testing-library/react";
import { act } from "react";
import PwaResumeReload from "../PwaResumeReload";

function setStandalone(value: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query === "(display-mode: standalone)" ? value : false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe("PwaResumeReload", () => {
  let listeners: Record<string, EventListener>;
  const originalLocation = window.location;

  beforeEach(() => {
    listeners = {};
    jest.spyOn(document, "addEventListener").mockImplementation((event, handler) => {
      listeners[event] = handler as EventListener;
    });
    jest.spyOn(document, "removeEventListener");

    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, reload: jest.fn() },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("does nothing when not in standalone mode", () => {
    setStandalone(false);
    render(<PwaResumeReload />);
    expect(listeners["visibilitychange"]).toBeUndefined();
  });

  it("registers visibilitychange listener in standalone mode", () => {
    setStandalone(true);
    render(<PwaResumeReload />);
    expect(listeners["visibilitychange"]).toBeDefined();
  });

  it("does not reload if app was hidden for less than 5 minutes", () => {
    setStandalone(true);
    render(<PwaResumeReload />);

    jest.spyOn(Date, "now").mockReturnValueOnce(1000);
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    act(() => listeners["visibilitychange"](new Event("visibilitychange")));

    // Resume 1 minute later
    jest.spyOn(Date, "now").mockReturnValueOnce(61_000);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => listeners["visibilitychange"](new Event("visibilitychange")));

    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it("reloads if app was hidden for more than 5 minutes", () => {
    setStandalone(true);
    render(<PwaResumeReload />);

    jest.spyOn(Date, "now").mockReturnValueOnce(1000);
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    act(() => listeners["visibilitychange"](new Event("visibilitychange")));

    // Resume 6 minutes later
    jest.spyOn(Date, "now").mockReturnValueOnce(361_000);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    act(() => listeners["visibilitychange"](new Event("visibilitychange")));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it("cleans up listener on unmount", () => {
    setStandalone(true);
    const { unmount } = render(<PwaResumeReload />);
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
  });
});
