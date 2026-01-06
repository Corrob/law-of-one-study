import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageInput from "../MessageInput";

describe("MessageInput", () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
  });

  describe("rendering", () => {
    it("should render textarea with default placeholder", () => {
      render(<MessageInput onSend={mockOnSend} />);

      expect(screen.getByPlaceholderText("Ask about the Ra Material...")).toBeInTheDocument();
    });

    it("should render textarea with custom placeholder", () => {
      render(<MessageInput onSend={mockOnSend} placeholder="Custom placeholder" />);

      expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
    });

    it("should render send button", () => {
      render(<MessageInput onSend={mockOnSend} />);

      expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
    });

    it("should disable send button when input is empty", () => {
      render(<MessageInput onSend={mockOnSend} />);

      const button = screen.getByRole("button", { name: "Send message" });
      expect(button).toBeDisabled();
    });
  });

  describe("input behavior", () => {
    it("should update value on typing", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Hello");

      expect(textarea).toHaveValue("Hello");
    });

    it("should enable send button when input has content", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Hello");

      const button = screen.getByRole("button", { name: "Send message" });
      expect(button).not.toBeDisabled();
    });

    it("should not enable send button for whitespace-only input", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "   ");

      const button = screen.getByRole("button", { name: "Send message" });
      expect(button).toBeDisabled();
    });

    it("should trim whitespace before sending", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "  Hello World  ");

      const button = screen.getByRole("button", { name: "Send message" });
      await user.click(button);

      expect(mockOnSend).toHaveBeenCalledWith("Hello World");
    });

    it("should clear input after sending", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Hello");

      const button = screen.getByRole("button", { name: "Send message" });
      await user.click(button);

      expect(textarea).toHaveValue("");
    });
  });

  describe("keyboard handling", () => {
    it("should submit on Enter", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Hello");
      await user.keyboard("{Enter}");

      expect(mockOnSend).toHaveBeenCalledWith("Hello");
    });

    it("should not submit on Shift+Enter", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Hello");
      await user.keyboard("{Shift>}{Enter}{/Shift}");

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it("should allow newlines with Shift+Enter", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Line 1");
      await user.keyboard("{Shift>}{Enter}{/Shift}");
      await user.type(textarea, "Line 2");

      expect(textarea).toHaveValue("Line 1\nLine 2");
    });
  });

  describe("disabled state", () => {
    it("should disable textarea when disabled prop is true", () => {
      render(<MessageInput onSend={mockOnSend} disabled />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      expect(textarea).toBeDisabled();
    });

    it("should disable send button when disabled", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} disabled />);

      // Even with content, button should be disabled
      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      fireEvent.change(textarea, { target: { value: "Hello" } });

      const button = screen.getByRole("button", { name: "Send message" });
      expect(button).toBeDisabled();
    });

    it("should not call onSend when disabled", async () => {
      render(<MessageInput onSend={mockOnSend} disabled />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      fireEvent.change(textarea, { target: { value: "Hello" } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe("character limit", () => {
    it("should not show counter when under 80% limit", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Short message");

      expect(screen.queryByText(/characters/)).not.toBeInTheDocument();
    });

    it("should show counter when near limit (>80%)", () => {
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      // 5000 * 0.8 = 4000, so we need > 4000 characters
      const longText = "a".repeat(4001);
      fireEvent.change(textarea, { target: { value: longText } });

      expect(screen.getByText(/4,001 \/ 5,000 characters/)).toBeInTheDocument();
    });

    it("should show error state when over limit", () => {
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      const tooLongText = "a".repeat(5001);
      fireEvent.change(textarea, { target: { value: tooLongText } });

      expect(screen.getByText(/over limit/)).toBeInTheDocument();
    });

    it("should disable send when over character limit", () => {
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      const tooLongText = "a".repeat(5001);
      fireEvent.change(textarea, { target: { value: tooLongText } });

      const button = screen.getByRole("button", { name: "Send message" });
      expect(button).toBeDisabled();
    });

    it("should not call onSend when over character limit", () => {
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      const tooLongText = "a".repeat(5001);
      fireEvent.change(textarea, { target: { value: tooLongText } });
      fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe("button click", () => {
    it("should call onSend when send button is clicked", async () => {
      const user = userEvent.setup();
      render(<MessageInput onSend={mockOnSend} />);

      const textarea = screen.getByPlaceholderText("Ask about the Ra Material...");
      await user.type(textarea, "Hello World");

      const button = screen.getByRole("button", { name: "Send message" });
      await user.click(button);

      expect(mockOnSend).toHaveBeenCalledWith("Hello World");
    });
  });
});
