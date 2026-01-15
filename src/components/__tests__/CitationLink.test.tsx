import { render, screen, fireEvent } from "@testing-library/react";
import CitationLink from "../CitationLink";
import { CitationModalProvider } from "@/contexts/CitationModalContext";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock fetchFullQuote
jest.mock("@/lib/quote-utils", () => ({
  fetchFullQuote: jest.fn().mockResolvedValue("Questioner: Test question?\n\nRa: I am Ra. Test answer."),
  formatWholeQuote: jest.fn((text) => text),
}));

// Helper to render with provider
function renderWithProvider(ui: React.ReactElement) {
  return render(<CitationModalProvider>{ui}</CitationModalProvider>);
}

describe("CitationLink", () => {
  describe("rendering", () => {
    it("should render the display text", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      expect(screen.getByText("(Ra 50.7)")).toBeInTheDocument();
    });

    it("should render as a button element", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have citation-link class", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("citation-link");
    });

    it("should have descriptive title attribute", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "View Ra 50.7");
    });
  });

  describe("modal interaction", () => {
    it("should open modal when clicked", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Modal should be visible with the reference as a link
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "50.7" })).toBeInTheDocument();
    });

    it("should close modal when X button is clicked", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      // Open modal
      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should have link to llresearch.org in modal", () => {
      renderWithProvider(<CitationLink session={50} question={7} displayText="(Ra 50.7)" />);

      // Open modal
      const button = screen.getByRole("button", { name: "(Ra 50.7)" });
      fireEvent.click(button);

      // Reference link goes to llresearch.org
      const externalLink = screen.getByRole("link", { name: "50.7" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/channeling/ra-contact/50#7");
      expect(externalLink).toHaveAttribute("target", "_blank");
      expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("different references", () => {
    it("should handle single-digit session and question", () => {
      renderWithProvider(<CitationLink session={1} question={1} displayText="(Ra 1.1)" />);

      const button = screen.getByRole("button", { name: "(Ra 1.1)" });
      fireEvent.click(button);

      const externalLink = screen.getByRole("link", { name: "1.1" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/channeling/ra-contact/1#1");
    });

    it("should handle three-digit session", () => {
      renderWithProvider(<CitationLink session={106} question={23} displayText="(Ra 106.23)" />);

      const button = screen.getByRole("button", { name: "(Ra 106.23)" });
      fireEvent.click(button);

      const externalLink = screen.getByRole("link", { name: "106.23" });
      expect(externalLink).toHaveAttribute("href", "https://www.llresearch.org/channeling/ra-contact/106#23");
    });
  });
});
