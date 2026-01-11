import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmModal from "../ConfirmModal";

// Helper to filter framer-motion props
const filterMotionProps = (props: Record<string, unknown>) => {
  const motionProps = [
    "initial", "animate", "exit", "transition", "variants",
    "whileHover", "whileTap", "whileFocus", "whileDrag", "whileInView",
    "layout", "layoutId", "drag", "dragConstraints", "onAnimationStart", "onAnimationComplete"
  ];
  const filtered: Record<string, unknown> = {};
  Object.keys(props).forEach(key => {
    if (!motionProps.includes(key)) {
      filtered[key] = props[key];
    }
  });
  return filtered;
};

// Mock framer-motion to avoid animation timing issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterMotionProps(props)}>{children}</div>
    ),
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...filterMotionProps(props)}>{children}</button>
    ),
    h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h2 {...filterMotionProps(props)}>{children}</h2>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...filterMotionProps(props)}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("ConfirmModal", () => {
  const defaultProps = {
    isOpen: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    title: "Test Title",
    message: "Test message content",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render when isOpen is true", () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test message content")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(<ConfirmModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
    });

    it("should render default button text", () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.getByText("Confirm")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should render custom button text", () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmText="Yes, do it"
          cancelText="No, go back"
        />
      );

      expect(screen.getByText("Yes, do it")).toBeInTheDocument();
      expect(screen.getByText("No, go back")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onConfirm when confirm button is clicked", () => {
      render(<ConfirmModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Confirm"));

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when cancel button is clicked", () => {
      render(<ConfirmModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Cancel"));

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when X button is clicked", () => {
      render(<ConfirmModal {...defaultProps} />);

      fireEvent.click(screen.getByLabelText("Close"));

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when backdrop is clicked", () => {
      render(<ConfirmModal {...defaultProps} />);

      // Click the backdrop (the outer overlay div)
      const backdrop = screen.getByRole("alertdialog").parentElement;
      fireEvent.click(backdrop!);

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("should not call onCancel when modal content is clicked", () => {
      render(<ConfirmModal {...defaultProps} />);

      // Click the modal content
      fireEvent.click(screen.getByRole("alertdialog"));

      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it("should call onCancel when Escape key is pressed", () => {
      render(<ConfirmModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("should have correct ARIA attributes", () => {
      render(<ConfirmModal {...defaultProps} />);

      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "confirm-title");
      expect(dialog).toHaveAttribute("aria-describedby", "confirm-message");
    });

    it("should have correct heading and message IDs", () => {
      render(<ConfirmModal {...defaultProps} />);

      expect(screen.getByText("Test Title")).toHaveAttribute("id", "confirm-title");
      expect(screen.getByText("Test message content")).toHaveAttribute("id", "confirm-message");
    });
  });
});
