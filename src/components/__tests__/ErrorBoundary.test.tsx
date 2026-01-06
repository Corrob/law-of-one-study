import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

// Component that throws an error
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>Normal content</div>;
}

// Suppress console.error during tests since we expect errors
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe("ErrorBoundary", () => {
  describe("when no error occurs", () => {
    it("should render children normally", () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("should not show error UI", () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("when error occurs", () => {
    it("should catch errors in child components", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should display error message", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/An unexpected error occurred/)
      ).toBeInTheDocument();
    });

    it("should show try again button", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("should not show children when error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Normal content")).not.toBeInTheDocument();
    });
  });

  describe("custom fallback", () => {
    it("should render custom fallback when provided", () => {
      const CustomFallback = () => <div>Custom error view</div>;

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom error view")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("reset functionality", () => {
    it("should have a working try again button", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify error state
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Get the try again button
      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();
      expect(tryAgainButton).toBeEnabled();

      // Click should not throw (the error boundary will catch the re-thrown error)
      expect(() => fireEvent.click(tryAgainButton)).not.toThrow();
    });

    it("should attempt to re-render children on reset", () => {
      // Track if component attempted to render
      let renderCount = 0;
      const TrackingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        renderCount++;
        if (shouldThrow) throw new Error("Test error");
        return <div>Success</div>;
      };

      render(
        <ErrorBoundary>
          <TrackingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const initialRenderCount = renderCount;
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Click try again - this should attempt to re-render children
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      // The component should have been called again (even if it throws)
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });
  });

  describe("error details in development", () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should show error details in development mode", () => {
      process.env.NODE_ENV = "development";

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // In development, error details should be visible
      expect(screen.getByText("Error details")).toBeInTheDocument();
    });

    it("should not show error details in production mode", () => {
      process.env.NODE_ENV = "production";

      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // In production, error details should not be visible
      expect(screen.queryByText("Error details")).not.toBeInTheDocument();
    });
  });

  describe("componentDidCatch", () => {
    it("should log error to console", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("error icon", () => {
    it("should display warning icon", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // The SVG warning icon should be present
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});
